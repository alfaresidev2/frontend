import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mashaheer Admin",
  description: "This is Mashaheer Influencer App Admin",
};

export default function SignIn() {
  return <SignInForm />;
}
