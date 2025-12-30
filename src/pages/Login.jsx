import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

    const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // Mark this session as verified so index.jsx/Layout.jsx will let the user in
      sessionStorage.setItem('sb-session-verified', 'true');
      await base44.auth.signIn();
    } catch (error) {
      console.error('Google Login failed:', error);
      sessionStorage.removeItem('sb-session-verified');
      alert('로그인 실패: ' + error.message);
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
        setIsLoading(true);
        // Mark this session as verified
        sessionStorage.setItem('sb-session-verified', 'true');
        await base44.auth.signInWithKakao();
    } catch (error) {
        console.error('Kakao Login failed:', error);
        sessionStorage.removeItem('sb-session-verified');
        alert('카카오 로그인 실패: ' + error.message);
        setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
        alert("이메일과 비밀번호를 모두 입력해주세요.");
        return;
    }

    try {
        setIsLoading(true);
        if (activeTab === "login") {
            // Set verification flag BEFORE auth so the resulting SIGNED_IN event works
            sessionStorage.setItem('sb-session-verified', 'true');
            await base44.auth.signInWithAuth(email, password);
        } else {
            const { user } = await base44.auth.signUp(email, password);
            if (user) {
                alert("회원가입 성공! 이메일 인증을 확인하거나 바로 로그인하세요.");
                setActiveTab("login");
            }
        }
    } catch (error) {
        console.error('Auth failed:', error);
        alert((activeTab === "login" ? "로그인" : "회원가입") + " 실패: " + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-500 shadow-xl border-slate-100">
        <CardHeader className="space-y-2 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Self-Bill</CardTitle>
          <CardDescription>
            이메일로 로그인하거나 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
                    {isLoading ? "연결 중..." : "Google로 계속하기"}
                </Button>
                <Button 
                    variant="outline" 
                    onClick={handleKakaoLogin} 
                    disabled={isLoading} 
                    className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-none"
                >
                    {isLoading ? "연결 중..." : "카카오로 계속하기"}
                </Button>
            </div>
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">또는 이메일로 계속하기</span>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">로그인</TabsTrigger>
                    <TabsTrigger value="signup">회원가입</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                     <form onSubmit={handleEmailAuth} className="grid gap-4 mt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "처리 중..." : "로그인"}
                        </Button>
                     </form>
                </TabsContent>
                <TabsContent value="signup">
                    <form onSubmit={handleEmailAuth} className="grid gap-4 mt-2">
                        <div className="grid gap-2">
                            <Label htmlFor="email-signup">이메일</Label>
                            <Input 
                                id="email-signup" 
                                type="email" 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password-signup">비밀번호</Label>
                            <Input 
                                id="password-signup" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "계정 생성 중..." : "계정 생성"}
                        </Button>
                     </form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
