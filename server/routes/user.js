import { Router } from "express";
import userAuth from "../middelwares/userAuth.js";
import { getUserData } from "../controllers/user.js";
const userRouter = Router();

userRouter.get("/data", userAuth, getUserData);
export default userRouter;
