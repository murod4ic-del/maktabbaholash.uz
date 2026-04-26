import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    login: string;
    role: "admin" | "teacher" | "parent";
    fullName: string;
    schoolId?: number;
  }

  interface Session {
    user: {
      id: string;
      login: string;
      role: "admin" | "teacher" | "parent";
      fullName: string;
      schoolId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    login: string;
    role: "admin" | "teacher" | "parent";
    fullName: string;
    schoolId?: number;
  }
}
