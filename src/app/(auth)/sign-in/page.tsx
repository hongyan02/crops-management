import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <Card className="w-full border-border/80 bg-white/88 py-0 shadow-[0_28px_70px_-42px_rgba(20,20,19,0.32)]">
      <CardHeader className="gap-2 px-7 pt-7 pb-5">
        {/* <span className="section-kicker">Sign In</span> */}
        <CardTitle className="font-heading text-4xl leading-none font-normal tracking-[-0.04em]">
          登录
        </CardTitle>
        {/* <CardDescription className="text-sm text-muted-foreground">用户名与密码</CardDescription> */}
      </CardHeader>

      <CardContent className="flex flex-col gap-6 px-7 pb-7">
        <SignInForm />
        <p className="text-center text-sm text-muted-foreground">
          没有账号？{" "}
          <Link className="text-foreground underline underline-offset-4" href="/sign-up">
            联系管理员开通
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
