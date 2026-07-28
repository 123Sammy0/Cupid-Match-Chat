"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, signupAction, checkUsernameAvailability } from "@/app/actions/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Validation States
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Username live check debounce
  useEffect(() => {
    if (isLogin) return;
    
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    if (cleanUsername !== username) {
      setUsername(cleanUsername);
    }

    if (!cleanUsername) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameMessage("Must be at least 3 characters.");
      return;
    }
    
    if (cleanUsername.length > 20) {
      setUsernameStatus("unavailable");
      setUsernameMessage("Maximum 20 characters allowed.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    const timeoutId = setTimeout(async () => {
      const res = await checkUsernameAvailability(cleanUsername);
      if (res.available) {
        setUsernameStatus("available");
        setUsernameMessage("Username is available!");
      } else {
        setUsernameStatus("unavailable");
        setUsernameMessage(res.message || "Username is taken.");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isLogin]);

  // Password Strength Logic
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strengthValue = 0;
  if (hasMinLength) strengthValue++;
  if (hasUppercase) strengthValue++;
  if (hasLowercase) strengthValue++;
  if (hasNumber) strengthValue++;
  if (hasSpecial) strengthValue++;

  let strengthLabel = "Weak";
  let strengthColor = "bg-red-500";
  if (strengthValue >= 3 && strengthValue < 5) {
    strengthLabel = "Medium";
    strengthColor = "bg-yellow-500";
  } else if (strengthValue === 5) {
    strengthLabel = "Strong";
    strengthColor = "bg-green-500";
  }

  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const showMismatch = confirmPassword.length > 0 && !doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!isLogin && usernameStatus !== "available") {
      setFormError("Please choose a valid and available username.");
      return;
    }

    if (!isLogin && strengthValue < 3) {
      setFormError("Your password is too weak.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await loginAction(username, password);
        if (res.success) {
          router.push("/room");
        } else {
          setFormError(res.message || "Login failed");
        }
      } else {
        if (!doPasswordsMatch) {
          setFormError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        
        const res = await signupAction(username, password);
        if (res.success) {
          router.push("/room");
        } else {
          setFormError(res.message || "Signup failed");
        }
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF6EE] text-black overflow-y-auto p-4">
      <section className="auth-card border border-gray-200 shadow-xl bg-white m-4 relative w-full max-w-[420px] p-8 rounded-3xl overflow-hidden transition-all duration-300">
        <button className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors" aria-label="Return to library" onClick={() => router.push("/")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-xl mb-4 shadow-md">✦</div>
          <h2 className="text-2xl font-bold text-center text-black tracking-tight">{isLogin ? "Welcome back" : "Create Account"}</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {isLogin ? "Enter your details to open your room." : "Join the private messaging space."}
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* USERNAME FIELD */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">Username</span>
            <div className="relative">
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. moonlight" 
                className={`w-full p-3 border rounded-xl bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors ${!isLogin && usernameStatus === 'unavailable' ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'}`}
              />
              {!isLogin && username && (
                <div className="absolute right-3 top-3.5">
                  {usernameStatus === 'checking' && <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>}
                  {usernameStatus === 'available' && <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  {usernameStatus === 'unavailable' && <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>}
                </div>
              )}
            </div>
            {!isLogin && usernameMessage && (
              <span className={`text-xs mt-1 transition-colors ${usernameStatus === 'available' ? 'text-green-600' : usernameStatus === 'unavailable' ? 'text-red-500' : 'text-gray-500'}`}>
                {usernameMessage}
              </span>
            )}
          </label>

          {/* PASSWORD FIELD */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">Password</span>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-black focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/10 pr-10 transition-colors"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-3.5 text-gray-400 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator (Signup Only) */}
            {!isLogin && password.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 animate-in fade-in">
                <div className="flex gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level} 
                      className={`flex-1 rounded-full transition-all duration-300 ${strengthValue >= level ? strengthColor : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold ${strengthValue < 3 ? 'text-red-500' : strengthValue < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {strengthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-500 mt-1">
                  <span className={hasMinLength ? "text-green-600" : ""}>{hasMinLength ? "✓" : "○"} 8+ characters</span>
                  <span className={hasUppercase ? "text-green-600" : ""}>{hasUppercase ? "✓" : "○"} Uppercase</span>
                  <span className={hasLowercase ? "text-green-600" : ""}>{hasLowercase ? "✓" : "○"} Lowercase</span>
                  <span className={hasNumber ? "text-green-600" : ""}>{hasNumber ? "✓" : "○"} Number</span>
                  <span className={hasSpecial ? "text-green-600" : ""}>{hasSpecial ? "✓" : "○"} Special character</span>
                </div>
              </div>
            )}
          </label>

          {/* CONFIRM PASSWORD (Signup Only) */}
          {!isLogin && (
            <label className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 fade-in">
              <span className="text-sm font-semibold text-gray-700">Confirm Password</span>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-black/10 pr-10 transition-colors ${showMismatch ? 'border-red-300 focus:border-red-500' : doPasswordsMatch ? 'border-green-300 focus:border-green-500' : 'border-gray-200 focus:border-gray-400'}`}
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-3.5">
                    {doPasswordsMatch ? (
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    )}
                  </div>
                )}
              </div>
              {showMismatch && <span className="text-xs text-red-500 mt-1">Passwords do not match.</span>}
              {doPasswordsMatch && <span className="text-xs text-green-600 mt-1">Passwords match!</span>}
            </label>
          )}

          {/* LOGIN OPTIONS */}
          {isLogin && (
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <span className="text-gray-600 group-hover:text-black transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-gray-500 hover:text-black transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button 
            className="w-full py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2 shadow-sm" 
            type="submit" 
            disabled={isLoading || (!isLogin && usernameStatus !== 'available') || (!isLogin && (!doPasswordsMatch || strengthValue < 3))}
          >
            {isLoading ? "Please wait..." : (isLogin ? "Log in" : "Create Account")}
          </button>
        </form>

        <div className="flex flex-col gap-4 mt-6 items-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError("");
              setUsername("");
              setPassword("");
              setConfirmPassword("");
              setUsernameStatus("idle");
              setUsernameMessage("");
            }} 
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>

          {isLogin && (
            <div className="pt-4 border-t border-gray-100 w-full flex justify-center">
              <button 
                type="button" 
                onClick={() => router.push('/admin')}
                className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Administrator Login
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
