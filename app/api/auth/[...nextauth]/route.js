import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@utils/database";
import { User } from "@models/user";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  async session({ session }) {
    const user = await User.findOne({ email: session.user.email });

    session.user.id = user._id.toString();
    return session;
  },
  async signIn({ profile }) {
    try {
      // serverless -> lambda -> dynamodb
      await connectToDatabase();
      // check if a user already exists in the database with the given email
      const userExists = await User.findOne({ email: profile.email });
      // if not, create a new user
      if (!userExists) {
        await User.create({
          email: profile.email,
          username: profile.email.split(" ", "").tolowercase(),
          image: profile.picture,
        });
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
});

export { handler as GET, handler as POST };
