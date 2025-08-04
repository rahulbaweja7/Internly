const { google } = require("googleapis");
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);


const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// Function to generate OAuth URL
const generateAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
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
    const existingJobs = await Job.find({}, 'emailId company role');
    const processedIds = existingJobs.map(job => job.emailId).filter(id => id);
    console.log('Found processed email IDs:', processedIds.length);
    console.log('Processed IDs:', processedIds.slice(0, 5)); // Log first 5 for debugging
    console.log('Existing jobs:', existingJobs.map(job => ({ company: job.company, role: job.role, emailId: job.emailId })));
    return processedIds;
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

    console.log('Parsing email:', { subject, snippet });

    // Determine application status based on email content
    let status = 'Applied';
    const fullText = (subject + ' ' + snippet).toLowerCase();
    
    if (fullText.includes('online assessment') || fullText.includes('coding challenge') || 
        fullText.includes('hackerrank') || fullText.includes('leetcode') || 
        fullText.includes('technical assessment') || fullText.includes('coding test')) {
      status = 'Online Assessment';
    } else if (fullText.includes('phone interview') || fullText.includes('screening call') || 
               fullText.includes('initial interview') || fullText.includes('recruiter call')) {
      status = 'Phone Interview';
    } else if (fullText.includes('technical interview') || fullText.includes('coding interview') || 
               fullText.includes('technical round') || fullText.includes('technical discussion')) {
      status = 'Technical Interview';
    } else if (fullText.includes('final interview') || fullText.includes('onsite interview') || 
               fullText.includes('final round') || fullText.includes('superday')) {
      status = 'Final Interview';
    } else if (fullText.includes('accepted') || fullText.includes('congratulations') || 
               fullText.includes('offer') || fullText.includes('welcome')) {
      status = 'Accepted';
    } else if (fullText.includes('rejected') || fullText.includes('unfortunately') || 
               fullText.includes('not moving forward') || fullText.includes('not selected')) {
      status = 'Rejected';
    } else if (fullText.includes('waitlist') || fullText.includes('wait list') || 
               fullText.includes('on hold') || fullText.includes('pending')) {
      status = 'Waitlisted';
    } else if (fullText.includes('withdrawn') || fullText.includes('withdraw')) {
      status = 'Withdrawn';
    }

    // Extract company name from subject or snippet
    let company = 'Unknown Company';
    
    // First try to extract from subject
    const subjectCompanyPatterns = [
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
    
    // If not found in subject, try to extract from snippet
    if (company === 'Unknown Company') {
      // Direct string matching for common patterns
      if (snippet.includes('Software Engineer, Internship at Palantir')) {
        company = 'Palantir';
      } else if (snippet.includes('Software Engineer, Internship at')) {
        const match = snippet.match(/Software Engineer, Internship at ([A-Z][a-zA-Z\s&]+?)(?:\s+\.|\.|,|!|\?|$)/i);
        if (match) company = match[1].trim();
      } else if (snippet.includes('Internship at')) {
        const match = snippet.match(/Internship at ([A-Z][a-zA-Z\s&]+?)(?:\s+\.|\.|,|!|\?|$)/i);
        if (match) company = match[1].trim();
      } else if (snippet.includes('at ')) {
        const match = snippet.match(/at ([A-Z][a-zA-Z\s&]+?)(?:\s+\.|\.|,|!|\?|$)/i);
        if (match) company = match[1].trim();
      }
    }

    // Clean up company name
    company = company.replace(/\s+successfully submitted$/i, '');
    company = company.replace(/\s+work with\s+/i, '');
    company = company.replace(/\s+team$/i, '');
    company = company.replace(/\s+\.$/i, '');
    company = company.replace(/\s+,$/i, '');
    company = company.charAt(0).toUpperCase() + company.slice(1).toLowerCase();

    // Extract position from subject or snippet
    let position = 'Unknown Position';
    
    // Direct string matching for common patterns
    if (snippet.includes('Software Engineer, Internship at')) {
      position = 'Software Engineer Intern';
    } else if (snippet.includes('Software Engineer Intern')) {
      position = 'Software Engineer Intern';
    } else if (snippet.includes('Frontend Developer Intern')) {
      position = 'Frontend Developer Intern';
    } else if (snippet.includes('Backend Developer Intern')) {
      position = 'Backend Developer Intern';
    } else if (snippet.includes('Full Stack Developer Intern')) {
      position = 'Full Stack Developer Intern';
    } else if (snippet.includes('Data Scientist Intern')) {
      position = 'Data Scientist Intern';
    } else if (snippet.includes('Product Manager Intern')) {
      position = 'Product Manager Intern';
    } else if (snippet.includes('Designer Intern')) {
      position = 'Designer Intern';
    } else if (snippet.includes('UX Designer Intern')) {
      position = 'UX Designer Intern';
    } else if (snippet.includes('UI Designer Intern')) {
      position = 'UI Designer Intern';
    } else if (snippet.includes('Marketing Intern')) {
      position = 'Marketing Intern';
    } else if (snippet.includes('Sales Intern')) {
      position = 'Sales Intern';
    } else if (snippet.includes('Finance Intern')) {
      position = 'Finance Intern';
    } else if (snippet.includes('Consulting Intern')) {
      position = 'Consulting Intern';
    } else if (snippet.includes('Investment Banking Intern')) {
      position = 'Investment Banking Intern';
    } else if (snippet.includes('Trading Intern')) {
      position = 'Trading Intern';
    } else if (snippet.includes('Quantitative Analyst Intern')) {
      position = 'Quantitative Analyst Intern';
    } else if (snippet.includes('Cybersecurity Intern')) {
      position = 'Cybersecurity Intern';
    } else if (snippet.includes('DevOps Intern')) {
      position = 'DevOps Intern';
    } else if (snippet.includes('Cloud Engineer Intern')) {
      position = 'Cloud Engineer Intern';
    } else if (snippet.includes('Mobile Developer Intern')) {
      position = 'Mobile Developer Intern';
    } else if (snippet.includes('iOS Developer Intern')) {
      position = 'iOS Developer Intern';
    } else if (snippet.includes('Android Developer Intern')) {
      position = 'Android Developer Intern';
    } else if (snippet.includes('React Developer Intern')) {
      position = 'React Developer Intern';
    } else if (snippet.includes('Python Developer Intern')) {
      position = 'Python Developer Intern';
    } else if (snippet.includes('Java Developer Intern')) {
      position = 'Java Developer Intern';
    } else if (snippet.includes('C++ Developer Intern')) {
      position = 'C++ Developer Intern';
    } else if (snippet.includes('Go Developer Intern')) {
      position = 'Go Developer Intern';
    } else if (snippet.includes('Rust Developer Intern')) {
      position = 'Rust Developer Intern';
    } else if (snippet.includes('Blockchain Developer Intern')) {
      position = 'Blockchain Developer Intern';
    } else if (snippet.includes('Web3 Developer Intern')) {
      position = 'Web3 Developer Intern';
    } else if (snippet.includes('Summer Intern')) {
      position = 'Summer Intern';
    } else if (snippet.includes('Fall Intern')) {
      position = 'Fall Intern';
    } else if (snippet.includes('Spring Intern')) {
      position = 'Spring Intern';
    } else if (snippet.includes('Graduate Program')) {
      position = 'Graduate Program';
    } else if (snippet.includes('Analyst Program')) {
      position = 'Analyst Program';
    } else if (snippet.includes('Associate Program')) {
      position = 'Associate Program';
    } else {
      // Fallback to regex patterns
      const fullText = (subject + ' ' + snippet).toLowerCase();
      const positionPatterns = [
        /software engineer[^,\n]*intern[^,\n]*/i,
        /frontend[^,\n]*intern[^,\n]*/i,
        /backend[^,\n]*intern[^,\n]*/i,
        /full stack[^,\n]*intern[^,\n]*/i,
        /data scientist[^,\n]*intern[^,\n]*/i,
        /machine learning[^,\n]*intern[^,\n]*/i,
        /ai[^,\n]*intern[^,\n]*/i,
        /product manager[^,\n]*intern[^,\n]*/i,
        /quantitative[^,\n]*intern[^,\n]*/i,
        /investment[^,\n]*intern[^,\n]*/i,
        /trading[^,\n]*intern[^,\n]*/i,
        /finance[^,\n]*intern[^,\n]*/i,
        /consulting[^,\n]*intern[^,\n]*/i,
        /marketing[^,\n]*intern[^,\n]*/i,
        /sales[^,\n]*intern[^,\n]*/i,
        /design[^,\n]*intern[^,\n]*/i,
        /ux[^,\n]*intern[^,\n]*/i,
        /ui[^,\n]*intern[^,\n]*/i,
        /cybersecurity[^,\n]*intern[^,\n]*/i,
        /devops[^,\n]*intern[^,\n]*/i,
        /cloud[^,\n]*intern[^,\n]*/i,
        /mobile[^,\n]*intern[^,\n]*/i,
        /ios[^,\n]*intern[^,\n]*/i,
        /android[^,\n]*intern[^,\n]*/i,
        /react[^,\n]*intern[^,\n]*/i,
        /python[^,\n]*intern[^,\n]*/i,
        /java[^,\n]*intern[^,\n]*/i,
        /c\+\+[^,\n]*intern[^,\n]*/i,
        /golang[^,\n]*intern[^,\n]*/i,
        /rust[^,\n]*intern[^,\n]*/i,
        /blockchain[^,\n]*intern[^,\n]*/i,
        /web3[^,\n]*intern[^,\n]*/i,
        /summer[^,\n]*intern[^,\n]*/i,
        /fall[^,\n]*intern[^,\n]*/i,
        /spring[^,\n]*intern[^,\n]*/i,
        /graduate[^,\n]*program[^,\n]*/i,
        /analyst[^,\n]*program[^,\n]*/i,
        /associate[^,\n]*program[^,\n]*/i
      ];
      
      for (const pattern of positionPatterns) {
        const match = fullText.match(pattern);
        if (match) {
          position = match[0].trim();
          console.log('Found position from common pattern:', position);
          break;
        }
      }
    }

    console.log('Final parsed result:', { company, position, status });

    // Parse date
    const emailDate = new Date(date);
    const formattedDate = emailDate.toISOString().split('T')[0];

    return {
      company: company,
      position: position,
      location: '', // Would need to extract from email body
      status: status,
      appliedDate: formattedDate,
      emailId: email.id,
      subject: subject,
      snippet: snippet
    };
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
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