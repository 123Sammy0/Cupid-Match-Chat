const fs = require('fs');
const path = require('path');

// 1. Rename middleware.ts so Vercel ignores it
const middlewarePath = path.join(__dirname, 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  fs.renameSync(middlewarePath, path.join(__dirname, 'middleware.ts.backup'));
  console.log('✅ Disabled middleware.ts');
}

// 2. Move the login folder out of the admin layout to prevent infinite redirects
const oldLoginPath = path.join(__dirname, 'src', 'app', 'admin', 'login');
const newLoginPath = path.join(__dirname, 'src', 'app', 'admin-login');

if (fs.existsSync(oldLoginPath)) {
  fs.renameSync(oldLoginPath, newLoginPath);
  console.log('✅ Moved login page to /admin-login');
}

// 3. Update paths in admin-login/page.tsx
const loginPagePath = path.join(newLoginPath, 'page.tsx');
if (fs.existsSync(loginPagePath)) {
  let content = fs.readFileSync(loginPagePath, 'utf8');
  content = content.replace(/redirect\('\/admin'\)/g, "redirect('/admin')"); // Already fine
  fs.writeFileSync(loginPagePath, content);
}

// 4. Update the verifySuperAdmin redirect path
const adminActionsPath = path.join(__dirname, 'src', 'app', 'actions', 'admin.ts');
if (fs.existsSync(adminActionsPath)) {
  let content = fs.readFileSync(adminActionsPath, 'utf8');
  content = content.replace(/redirect\("\/admin\/login"\)/g, 'redirect("/admin-login")');
  fs.writeFileSync(adminActionsPath, content);
  console.log('✅ Updated admin.ts redirects');
}

console.log('All fixes applied! You can now commit and push.');
