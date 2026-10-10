<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moni Minutes | Reset Password</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="auth-body">
    <div class="auth-shell single-auth">
      <div class="auth-card wide-card">
        <p class="eyebrow accent">Security</p>
        <h2>Reset your password</h2>

        <form id="resetPasswordForm">
          <label>
            <span>Reset token</span>
            <input type="text" id="resetToken" placeholder="Paste token from email" required />
          </label>

          <label>
            <span>New password</span>
            <input type="password" id="newPassword" placeholder="••••••••" required />
          </label>

          <button class="primary-btn wide" type="submit">Update password</button>
        </form>
      </div>
    </div>

    <script src="/app.js"></script>
  </body>
</html>
