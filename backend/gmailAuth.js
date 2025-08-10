const { google } = require("googleapis");
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);


const gmail = google.gmail({ version: "v1", auth: oauth2Client });

const generateAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    prompt: "consent",
    include_granted_scopes: true,
    response_type: "code"
  });
};

// Function to get tokens from authorization code
const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

// Function to set credentials from stored tokens
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

// Function to fetch recent emails with job application keywords
const fetchJobApplicationEmails = async (maxResults = 200) => {
  try {
    // Simple search for all emails containing "application"
    const query = 'application';
    
    console.log('Searching for emails containing "application"...');
    
    const messages = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: maxResults
    });

    console.log('Found messages:', messages.data.messages?.length || 0);

    if (!messages.data.messages) {
      return [];
    }

    // Get full message details for each email
    const emailPromises = messages.data.messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: 'full'
      });
      return msg.data;
    });

    const emails = await Promise.all(emailPromises);
    console.log('Processed emails:', emails.length);
    
    // Filter emails to only include job application related ones
    const jobApplicationEmails = emails.filter(email => {
      const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
      const snippet = email.snippet || '';
      const fullText = (subject + ' ' + snippet).toLowerCase();
      
      // Include emails that are likely job application related
      const isJobApplication = 
        fullText.includes('thank you for applying') ||
        fullText.includes('application received') ||
        fullText.includes('application submitted') ||
        fullText.includes('application has been received') ||
        fullText.includes('application successfully submitted') ||
        fullText.includes('we received your application') ||
        fullText.includes('your application has been received') ||
        fullText.includes('application is in review') ||
        fullText.includes('application will be reviewed') ||
        fullText.includes('application under review') ||
        fullText.includes('application confirmation') ||
        fullText.includes('application status') ||
        fullText.includes('interview') ||
        fullText.includes('online assessment') ||
        fullText.includes('next steps') ||
        fullText.includes('moving forward') ||
        fullText.includes('next round') ||
        fullText.includes('technical interview') ||
        fullText.includes('phone interview') ||
        fullText.includes('final interview') ||
        fullText.includes('coding challenge') ||
        fullText.includes('hackerrank') ||
        fullText.includes('leetcode') ||
        fullText.includes('accepted') ||
        fullText.includes('rejected') ||
        fullText.includes('waitlist') ||
        fullText.includes('offer') ||
        fullText.includes('position') ||
        fullText.includes('role') ||
        fullText.includes('internship') ||
        fullText.includes('intern') ||
        fullText.includes('software engineer') ||
        fullText.includes('frontend') ||
        fullText.includes('backend') ||
        fullText.includes('full stack') ||
        fullText.includes('data scientist') ||
        fullText.includes('product manager') ||
        fullText.includes('designer') ||
        fullText.includes('developer') ||
        fullText.includes('engineer');
      
      return isJobApplication;
    });
    
    console.log('Filtered to job application emails:', jobApplicationEmails.length);
    return jobApplicationEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Function to get processed email IDs from existing jobs
const getProcessedEmailIds = async () => {
  try {
    const Job = require('./models/Job');
    const ProcessedEmail = require('./models/ProcessedEmail');
    
    // Get email IDs from jobs that were added to tracker
    const existingJobs = await Job.find({}, 'emailId company role');
    const jobEmailIds = existingJobs.map(job => job.emailId).filter(id => id);
    
    // Get email IDs that were marked as processed (but not added to tracker)
    const processedEmails = await ProcessedEmail.find({}, 'emailId');
    const processedEmailIds = processedEmails.map(email => email.emailId);
    
    // Combine both sets of processed email IDs
    const allProcessedIds = [...new Set([...jobEmailIds, ...processedEmailIds])];
    
    console.log('Found processed email IDs from jobs:', jobEmailIds.length);
    console.log('Found processed email IDs from marked emails:', processedEmailIds.length);
    console.log('Total processed email IDs:', allProcessedIds.length);
    console.log('Processed IDs:', allProcessedIds.slice(0, 5)); // Log first 5 for debugging
    
    return allProcessedIds;
  } catch (error) {
    console.error('Error getting processed email IDs:', error);
    return [];
  }
};

// Function to fetch only new job application emails
const fetchNewJobApplicationEmails = async (maxResults = 200) => {
  try {
    // Get all job application emails
    const allEmails = await fetchJobApplicationEmails(maxResults);
    
    // Get already processed email IDs
    const processedIds = await getProcessedEmailIds();
    
    console.log('Total emails found:', allEmails.length);
    console.log('Already processed emails:', processedIds.length);
    
    // Filter out already processed emails
    const newEmails = allEmails.filter(email => {
      const isProcessed = processedIds.includes(email.id);
      if (isProcessed) {
        console.log('Filtering out processed email:', email.id, 'Subject:', email.payload?.headers?.find(h => h.name === 'Subject')?.value);
      }
      return !isProcessed;
    });
    
    console.log('New emails found:', newEmails.length);
    
    // Log the first few new emails for debugging
    newEmails.slice(0, 3).forEach(email => {
      const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value;
      console.log('New email:', email.id, 'Subject:', subject);
    });
    
    return newEmails;
  } catch (error) {
    console.error('Error fetching new job application emails:', error);
    throw error;
  }
};

// Function to parse job application data from email
const parseJobApplicationFromEmail = (email) => {
  try {
    const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
    const from = email.payload?.headers?.find(h => h.name === 'From')?.value || '';
    const date = email.payload?.headers?.find(h => h.name === 'Date')?.value || '';
    const snippet = email.snippet || '';
    const fullText = (subject + ' ' + snippet).toLowerCase();

    console.log('Parsing email:', { subject, snippet });

    // === STATUS ===
    let status = 'Applied';
    if (fullText.includes('online assessment') || fullText.includes('hackerrank') || fullText.includes('coding challenge')) {
      status = 'Online Assessment';
    } else if (fullText.includes('phone interview') || fullText.includes('screening call')) {
      status = 'Phone Interview';
    } else if (fullText.includes('technical interview')) {
      status = 'Technical Interview';
    } else if (fullText.includes('final interview') || fullText.includes('onsite')) {
      status = 'Final Interview';
    } else if (fullText.includes('offer') || fullText.includes('congratulations')) {
      status = 'Accepted';
    } else if (fullText.includes('rejected') || fullText.includes('unfortunately')) {
      status = 'Rejected';
    } else if (fullText.includes('waitlist') || fullText.includes('pending')) {
      status = 'Waitlisted';
    } else if (fullText.includes('withdrawn') || fullText.includes('withdraw')) {
      status = 'Withdrawn';
    }

    // === POSITION ===
    let position = 'Unknown Position';

    // Try known pattern matches first
    const knownRoles = [
      'Software Engineer Intern', 'Frontend Developer Intern', 'Backend Developer Intern',
      'Full Stack Developer Intern', 'Data Scientist Intern', 'Product Manager Intern',
      'Designer Intern', 'UX Designer Intern', 'Marketing Intern', 'Cybersecurity Intern',
      'DevOps Intern', 'Cloud Engineer Intern', 'Mobile Developer Intern', 'Java Developer Intern',
      'React Developer Intern', 'Python Developer Intern', 'Trading Intern', 'Consulting Intern',
      'Finance Intern', 'Quantitative Analyst Intern', 'Graduate Program', 'Summer Intern'
    ];
    for (const role of knownRoles) {
      if (fullText.includes(role.toLowerCase())) {
        position = role;
        break;
      }
    }

    // Try to extract from subject line patterns
    if (position === 'Unknown Position') {
      // Look for patterns like "Software Engineer - Frontend" in subject
      const subjectMatch = subject.match(/(software engineer[^,\n]*?)(?:\s+-\s+|\s+opening|\s+position|\s*$)/i);
      if (subjectMatch) {
        position = subjectMatch[1].trim();
        // Only add "Intern" if it's not already there
        if (!position.toLowerCase().includes('intern')) {
          position += ' Intern';
        }
      }
    }

    // If no known role found, try to extract from "at" pattern
    if (position === 'Unknown Position') {
      // Try to extract from "You Successfully Applied To X" pattern
      const successMatch = snippet.match(/you successfully applied to (.+?)(?:\s+at|\s+internship|\s*$)/i);
      if (successMatch) {
        position = successMatch[1].trim();
        // Only add "Intern" if it's not already there
        if (!position.toLowerCase().includes('intern')) {
          position += ' Intern';
        }
      }
      
      // Try to extract from "X internship at Y" pattern
      if (position === 'Unknown Position') {
        const atPattern = /(.+?)\s+internship\s+at\s+/i;
        const atMatch = snippet.match(atPattern);
        if (atMatch) {
          position = atMatch[1].trim();
          // Only add "Intern" if it's not already there
          if (!position.toLowerCase().includes('intern')) {
            position += ' Intern';
          }
        }
      }
      
      // Try to extract from "University Grad" pattern
      if (position === 'Unknown Position') {
        const gradMatch = snippet.match(/university grad \d{4}:\s*(.+?)(?:\s+opening|\s+position|\s+at|\s*$)/i);
        if (gradMatch) {
          position = gradMatch[1].trim();
          // Only add "Intern" if it's not already there
          if (!position.toLowerCase().includes('intern')) {
            position += ' Intern';
          }
        }
      }
      
      // Try to extract from "Software Engineer" pattern
      if (position === 'Unknown Position') {
        const engineerMatch = snippet.match(/(software engineer[^,\n]*?)(?:\s+opening|\s+position|\s+at|\s*$)/i);
        if (engineerMatch) {
          position = engineerMatch[1].trim();
          // Only add "Intern" if it's not already there
          if (!position.toLowerCase().includes('intern')) {
            position += ' Intern';
          }
        }
      }
      
      // If still not found, try to extract from the beginning of the snippet
      if (position === 'Unknown Position') {
        const startMatch = snippet.match(/^([^,]+?)(?:\s+at\s+|\s+internship\s+at\s+)/i);
        if (startMatch) {
          position = startMatch[1].trim();
          // Only add "Intern" if it's not already there
          if (!position.toLowerCase().includes('intern')) {
            position += ' Intern';
          }
        }
      }
    }

    // Clean position - remove any "at company" or "on day" parts
    position = position
      .replace(/\sat\s+[^,\n]+/gi, '') // remove "at Redis on Monday"
      .replace(/\son\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
      .replace(/\s+apply\s+to\s+similar\s+jobs\?/gi, '')
      .replace(/[^\w\s]/g, '') // remove punctuation
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize title
    position = position.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Final cleanup: remove duplicate "Intern" if it appears twice
    position = position.replace(/\bIntern\s+Intern\b/gi, 'Intern');

    // Fallback: extract from "applied to" pattern
    if (position === 'Unknown Position') {
      const appliedMatch = fullText.match(/applied to (.+?) at /i);
      if (appliedMatch) {
        position = appliedMatch[1].trim();
        // Only add "Intern" if it's not already there
        if (!position.toLowerCase().includes('intern')) {
          position += ' Intern';
        }
      }
    }

    // === COMPANY ===
    let company = 'Unknown Company';
    
    // First try to extract from common email patterns
    const subjectCompanyPatterns = [
      /you applied to ([^!,\n]+)/i,
      /thank you for applying to ([^!,\n]+)/i,
      /application to ([^!,\n]+)/i,
      /we received your application for ([^!,\n]+)/i,
      /thank you for your interest in ([^!,\n]+)/i
    ];
    for (const pattern of subjectCompanyPatterns) {
      const match = subject.match(pattern);
      if (match) {
        company = match[1].trim();
        break;
      }
    }
    
    // If not found in subject, try to extract from snippet using "at" pattern
    if (company === 'Unknown Company') {
      // Try the specific pattern for "internship at company on day"
      const atMatch = snippet.match(/(?:internship|position|role)\s+at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+on\s+[A-Za-z]+|\s+\.|\.|,|!|\?|$)/i);
      if (atMatch) {
        company = atMatch[1].trim();
      }
      
      // If still not found, try a more general pattern
      if (company === 'Unknown Company') {
        const generalMatch = snippet.match(/at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+on\s+[A-Za-z]+|\s+\.|\.|,|!|\?|$)/i);
        if (generalMatch) {
          company = generalMatch[1].trim();
        }
      }
    }

    // Clean company name - remove day names and other unwanted text
    company = company
      .replace(/\son\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
      .replace(/\s+team$/i, '')
      .replace(/\s+successfully submitted$/i, '')
      .replace(/\s+apply\s+to\s+similar\s+jobs\?/gi, '')
      .replace(/[^\w\s&]/g, '') // remove punctuation
      .trim()
      .split(' ').slice(0, 3).join(' '); // max 3 words
    company = company.charAt(0).toUpperCase() + company.slice(1);

    // Capitalize title
    position = position.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Parse date
    const emailDate = new Date(date);
    const formattedDate = emailDate.toISOString().split('T')[0];

    return {
      company: company || 'Unknown Company',
      position: position || 'Unknown Position',
      location: '', // Would need to extract from email body
      status: status,
      appliedDate: formattedDate,
      emailId: email.id,
      subject: subject,
      snippet: snippet
    };

  } catch (err) {
    console.error('Error parsing email:', err);
    return {
      company: 'Unknown Company',
      position: 'Unknown Position',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      emailId: email.id,
      subject: '',
      snippet: ''
    };
  }
};

module.exports = {
  oauth2Client,
  gmail,
  generateAuthUrl,
  getTokensFromCode,
  setCredentials,
  fetchJobApplicationEmails,
  fetchNewJobApplicationEmails,
  parseJobApplicationFromEmail
}; 