const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { 
  generateAuthUrl, 
  getTokensFromCode, 
  setCredentials, 
  fetchJobApplicationEmails, 
  parseJobApplicationFromEmail,
  fetchNewJobApplicationEmails,
  gmail
} = require('../gmailAuth');
const GmailToken = require('../models/GmailToken');

// Step 1: Redirect to Google's OAuth 2.0 server
router.get('/auth', (req, res) => {
  const authUrl = generateAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Handle the OAuth callback
router.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Get tokens from authorization code
    const tokens = await getTokensFromCode(code);
    
    // Store tokens in database using authenticated user's ID if available
    const userId = req.user?._id?.toString() || 'default-user';
    
    await GmailToken.findOneAndUpdate(
      { userId },
      {
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      },
      { upsert: true, new: true }
    );

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?gmail_connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?gmail_error=true`);
  }
});

// Step 3: Fetch job application emails
router.get('/fetch-emails', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || 'default-user';
    
    // Get stored tokens
    const tokenDoc = await GmailToken.findOne({ userId });
    
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });
    }

    // Set credentials from stored tokens
    setCredentials({
      access_token: tokenDoc.access_token,
      refresh_token: tokenDoc.refresh_token,
      scope: tokenDoc.scope,
      token_type: tokenDoc.token_type,
      expiry_date: tokenDoc.expiry_date
    });

    // Fetch only new emails (not already processed)
    const emails = await fetchNewJobApplicationEmails(200); // Get last 200 emails
    
    // Parse job applications from emails
    // De-duplicate by Gmail threadId (group conversation) and message id
    const seenMessageIds = new Set();
    const seenThreadIds = new Set();
    const parsed = [];
    for (const email of emails) {
      if (seenMessageIds.has(email.id)) continue;
      if (email.threadId && seenThreadIds.has(email.threadId)) continue;
      const app = parseJobApplicationFromEmail(email);
      if (app) {
        parsed.push(app);
        seenMessageIds.add(email.id);
        if (email.threadId) seenThreadIds.add(email.threadId);
      }
    }

    const jobApplications = parsed;

    res.json({
      success: true,
      count: jobApplications.length,
      applications: jobApplications
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
});

// Step 4: Check Gmail connection status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || 'default-user';
    const tokenDoc = await GmailToken.findOne({ userId });
    
    res.json({
      connected: !!tokenDoc,
      lastConnected: tokenDoc ? tokenDoc.updatedAt : null
    });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    res.status(500).json({ error: 'Failed to check Gmail status' });
  }
});

// Step 5: Mark email as processed (so it won't show up in future scans)
router.post('/mark-processed', isAuthenticated, async (req, res) => {
  try {
    const { emailId } = req.body;
    const userId = req.user?._id?.toString() || 'default-user';
    
    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    // Store this email ID as processed so it won't show up in future scans
    // We can use a simple collection to track processed email IDs
    const ProcessedEmail = require('../models/ProcessedEmail');
    
    // Check if already processed
    const existing = await ProcessedEmail.findOne({ emailId, userId });
    if (!existing) {
      await ProcessedEmail.create({
        emailId: emailId,
        userId: userId,
        processedAt: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Email marked as processed',
      emailId: emailId
    });
  } catch (error) {
    console.error('Error marking email as processed:', error);
    res.status(500).json({ 
      error: 'Failed to mark email as processed', 
      details: error.message 
    });
  }
});

// Step 5: Delete email from Gmail (keeping this for reference, but not using it)
router.delete('/delete-email/:emailId', isAuthenticated, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = 'default-user';
    
    // Get stored tokens
    const tokenDoc = await GmailToken.findOne({ userId });
    
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });
    }

    // Set credentials from stored tokens
    setCredentials({
      access_token: tokenDoc.access_token,
      refresh_token: tokenDoc.refresh_token,
      scope: tokenDoc.scope,
      token_type: tokenDoc.token_type,
      expiry_date: tokenDoc.expiry_date
    });

    // Delete the email from Gmail
    await gmail.users.messages.delete({
      userId: 'me',
      id: emailId
    });

    res.json({ 
      success: true, 
      message: 'Email deleted successfully from Gmail',
      emailId: emailId
    });
  } catch (error) {
    console.error('Error deleting email from Gmail:', error);
    res.status(500).json({ 
      error: 'Failed to delete email from Gmail', 
      details: error.message 
    });
  }
});

// Step 5: Disconnect Gmail
router.delete('/disconnect', isAuthenticated, async (req, res) => {
  try {
    const userId = 'default-user';
    await GmailToken.findOneAndDelete({ userId });
    
    res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

// Step 6: Clear duplicates and check processed emails
router.get('/check-processed', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const existingJobs = await Job.find({}, 'emailId company role dateApplied');
    
    // Group by emailId to find duplicates
    const emailIdGroups = {};
    existingJobs.forEach(job => {
      if (job.emailId) {
        if (!emailIdGroups[job.emailId]) {
          emailIdGroups[job.emailId] = [];
        }
        emailIdGroups[job.emailId].push(job);
      }
    });
    
    const duplicates = Object.entries(emailIdGroups)
      .filter(([emailId, jobs]) => jobs.length > 1)
      .map(([emailId, jobs]) => ({ emailId, jobs }));
    
    res.json({
      totalJobs: existingJobs.length,
      jobsWithEmailId: existingJobs.filter(job => job.emailId).length,
      duplicates: duplicates,
      allJobs: existingJobs
    });
  } catch (error) {
    console.error('Error checking processed emails:', error);
    res.status(500).json({ error: 'Failed to check processed emails' });
  }
});

// Step 7: Clear duplicates
router.delete('/clear-duplicates', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const existingJobs = await Job.find({}, 'emailId company role _id');
    
    // Group by emailId to find duplicates
    const emailIdGroups = {};
    existingJobs.forEach(job => {
      if (job.emailId) {
        if (!emailIdGroups[job.emailId]) {
          emailIdGroups[job.emailId] = [];
        }
        emailIdGroups[job.emailId].push(job);
      }
    });
    
    // Keep only the first job for each emailId, delete the rest
    let deletedCount = 0;
    for (const [emailId, jobs] of Object.entries(emailIdGroups)) {
      if (jobs.length > 1) {
        // Keep the first one, delete the rest
        const jobsToDelete = jobs.slice(1);
        const idsToDelete = jobsToDelete.map(job => job._id);
        await Job.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += jobsToDelete.length;
      }
    }
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} duplicate entries`
    });
  } catch (error) {
    console.error('Error clearing duplicates:', error);
    res.status(500).json({ error: 'Failed to clear duplicates' });
  }
});

// Step 8: Update existing jobs with email IDs
router.post('/update-email-ids', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const existingJobs = await Job.find({ emailId: { $exists: false } });
    
    console.log('Found jobs without email IDs:', existingJobs.length);
    
    // For each job without email ID, try to find matching email
    let updatedCount = 0;
    for (const job of existingJobs) {
      // Search for emails that might match this job
      const { fetchJobApplicationEmails } = require('../gmailAuth');
      const emails = await fetchJobApplicationEmails(50);
      
      // Find email that matches this job's company and role
      const matchingEmail = emails.find(email => {
        const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
        const snippet = email.snippet || '';
        const fullText = (subject + ' ' + snippet).toLowerCase();
        
        return fullText.includes(job.company.toLowerCase()) && 
               fullText.includes(job.role.toLowerCase());
      });
      
      if (matchingEmail) {
        job.emailId = matchingEmail.id;
        await job.save();
        updatedCount++;
        console.log('Updated job:', job.company, job.role, 'with email ID:', matchingEmail.id);
      }
    }
    
    res.json({
      success: true,
      updatedCount: updatedCount,
      message: `Updated ${updatedCount} jobs with email IDs`
    });
  } catch (error) {
    console.error('Error updating email IDs:', error);
    res.status(500).json({ error: 'Failed to update email IDs' });
  }
});

// Step 9: Clear duplicates based on company and role (fallback method)
router.delete('/clear-duplicates-by-content', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const existingJobs = await Job.find({});
    
    // Group by company and role to find duplicates
    const contentGroups = {};
    existingJobs.forEach(job => {
      const key = `${job.company}-${job.role}`;
      if (!contentGroups[key]) {
        contentGroups[key] = [];
      }
      contentGroups[key].push(job);
    });
    
    // Keep only the first job for each company-role combination, delete the rest
    let deletedCount = 0;
    for (const [key, jobs] of Object.entries(contentGroups)) {
      if (jobs.length > 1) {
        // Keep the first one, delete the rest
        const jobsToDelete = jobs.slice(1);
        const idsToDelete = jobsToDelete.map(job => job._id);
        await Job.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += jobsToDelete.length;
        console.log(`Deleted ${jobsToDelete.length} duplicates for ${key}`);
      }
    }
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} duplicate entries based on company and role`
    });
  } catch (error) {
    console.error('Error clearing duplicates by content:', error);
    res.status(500).json({ error: 'Failed to clear duplicates by content' });
  }
});

module.exports = router; 