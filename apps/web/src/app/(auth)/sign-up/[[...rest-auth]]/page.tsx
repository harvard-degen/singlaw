import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Start your 21-day free trial
          </h1>
          <p className="text-slate-500 mt-1">
            No credit card required. Full access from day one.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
