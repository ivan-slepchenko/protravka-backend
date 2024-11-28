import { Request, Response } from 'express';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { AppDataSource } from '../index';
import { Operator } from '../models/Operator';

export const registerUser =  async (req: Request, res: Response) => {
  const { email, password, name, surname, birthday, phone } = req.body;
  const auth = getAuth();
  if (!email || !password || !name || !surname || !birthday || !phone) {
      res.status(422).json({
          email: "Email is required",
          password: "Password is required",
          name: "Name is required",
          surname: "Surname is required",
          birthday: "Birthday is required",
          phone: "Phone number is required",
      });
  } else {
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(auth.currentUser!);

          const operator = AppDataSource.getRepository(Operator).create({
            email,
            name,
            surname,
            birthday,
            phone,
          });
          await AppDataSource.getRepository(Operator).save(operator);

          res.status(201).json({ message: "Verification email sent! User created successfully!" });
      } catch (error) {
          const errorMessage = (error as Error).message || "An error occurred while registering user";
          res.status(500).json({ error: errorMessage });
      }
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const auth = getAuth();
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

export const logoutUser = async (req: Request, res: Response) => {
  const auth = getAuth();
    try {
    await signOut(auth);
    res.clearCookie('access_token');
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const auth = getAuth();
  if (!email) {
    res.status(422).json({
      email: "Email is required"
    });
  } else {
    try {
        await sendPasswordResetEmail(auth, email);
        res.status(200).json({ message: "Password reset email sent successfully!" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
  }
};