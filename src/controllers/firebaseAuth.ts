import { Request, Response } from 'express';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';

export const auth = getAuth();

export const registerUser =  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(422).json({
            email: "Email is required",
            password: "Password is required",
        });
    } else {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(auth.currentUser!);
            res.status(201).json({ message: "Verification email sent! User created successfully!" });
        } catch (error) {
            const errorMessage = (error as Error).message || "An error occurred while registering user";
            res.status(500).json({ error: errorMessage });
        }
    }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(422).json({
      email: "Email is required",
      password: "Password is required",
    });
  } else {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = userCredential.user.getIdToken();
        if (idToken) {
          res.cookie('access_token', await idToken, {
            httpOnly: true
          });
          res.status(200).json({ message: "User logged in successfully", userCredential });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      } catch (error) {
        const errorMessage = (error as Error).message || "An error occurred while logging in";
        res.status(500).json({ error: errorMessage });
      }
  }
};