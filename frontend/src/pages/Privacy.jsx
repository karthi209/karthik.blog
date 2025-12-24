export default function Privacy() {
  return (
    <div className="post legal-page">
      <h1 className="post-title">Privacy Policy</h1>
      <div className="post-content">
        <p><strong>(Last updated: 2025)</strong></p>
        <h3>The short version</h3>
        <p>This site does not track you, profile you, or sell your data.<br />
        If you choose to log in, a small amount of information is used so things like comments and likes can work.</p>
        <p>That’s it.</p>
        <h3>What information is collected</h3>
        <strong>1. When you browse</strong>
        <p>Nothing personally identifiable.</p>
        <ul>
          <li>This site does not:
            <ul>
              <li>Use analytics</li>
              <li>Track users across sites</li>
              <li>Set advertising cookies</li>
            </ul>
          </li>
        </ul>
        <p>Standard server logs (IP address, request time) may exist briefly for basic operation and security, like most websites.</p>
        <strong>2. When you log in</strong>
        <p>Login is handled via Google OAuth.</p>
        <p>When you sign in:</p>
        <ul>
          <li>Google shares your email address with this site</li>
          <li>Your email is used to identify you for actions like comments or likes</li>
        </ul>
        <p>This site:</p>
        <ul>
          <li>Does not create or store a user account</li>
          <li>Does not maintain a user profile database</li>
          <li>Does not store your Google password (it never sees it)</li>
        </ul>
        <p>Your identity is represented only by a temporary authentication token (JWT).</p>
        <strong>3. Comments and likes</strong>
        <p>If you comment on or like a post:</p>
        <ul>
          <li>Your email address (from Google login) is associated with that action</li>
          <li>This is used only to show attribution and prevent abuse</li>
          <li>No additional personal information is collected.</li>
        </ul>
        <h3>How your data is used</h3>
        <p>Your information is used only to:</p>
        <ul>
          <li>Authenticate you</li>
          <li>Attribute comments or likes</li>
          <li>Distinguish admins from regular users</li>
        </ul>
        <p>It is not used for:</p>
        <ul>
          <li>Marketing</li>
          <li>Analytics</li>
          <li>Advertising</li>
          <li>Profiling</li>
        </ul>
        <h3>Data storage</h3>
        <ul>
          <li>No persistent user accounts are stored</li>
          <li>No user profiles are maintained</li>
          <li>Authentication tokens expire</li>
          <li>Comment/like records may retain the email associated with them</li>
        </ul>
        <h3>Third-party services</h3>
        <p>This site uses:</p>
        <ul>
          <li>Google OAuth for authentication</li>
        </ul>
        <p>Google’s own privacy policy applies to the login process.</p>
        <h3>Your choices</h3>
        <ul>
          <li>You can browse the site without logging in</li>
          <li>You can choose not to comment or like posts</li>
          <li>If you don’t want your email associated with actions, don’t log in</li>
        </ul>
        <h3>Changes</h3>
        <p>If this policy changes, it will be updated here.<br />
        No silent rewrites.</p>
      </div>
    </div>
  );
}
