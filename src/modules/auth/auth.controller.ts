import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import { registerDto } from './auth.dto.ts';
import { registerService } from './auth.service.ts';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await registerService(req.body);

  return res.status(201).json({
    status: 'success',
    message: result.message,
  });
});

// const googleAuthCallback = catchAsync(async (req: Request, res: Response) => {
//   const data = await googleAuthCallbackService(req.user as IjwtUser);

//   const cookieLife = Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000;

//   res.cookie("token", data.token, {
//     signed: true,
//     httpOnly: true,
//     secure: true,
//     maxAge: cookieLife,
//     path: "/",
//   });

//   res.redirect("/");
// });

// const login = catchAsync(
//   async (req: Request<{}, {}, loginDto>, res: Response) => {
//     const data = await loginService(req.body);

//     let cookieLife = Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000;

//     if (req.body.rememberMe && req.body.rememberMe === "True")
//       cookieLife =
//         Number(process.env.COOKIE_EXPIRE_REMEMBER_ME) * 24 * 60 * 60 * 1000;

//     res.cookie("token", data.token, {
//       signed: true,
//       httpOnly: true,
//       secure: true,
//       maxAge: cookieLife,
//       path: "/",
//     });

//     res.status(200).json({ status: "success", message: data.message });
//   },
// );

// const sendOtp = catchAsync(
//   async (req: Request<{}, {}, sendOtpDto>, res: Response) => {
//     const data = await sendOtpService(req.body);

//     res
//       .status(200)
//       .json({ status: "success", message: data.message, otp: data.otp });
//   },
// );

// const verigyOtp = catchAsync(
//   async (req: Request<{}, {}, verigyOtpDto>, res: Response) => {
//     const data = await verigyOtpService(req.body);

//     res.status(200).json({ status: "success", message: data.message });
//   },
// );

// const forgotPassword = catchAsync(
//   async (req: Request<{}, {}, forgotPasswordDto>, res: Response) => {
//     const data = await forgotPasswordService(req.body);

//     res
//       .status(200)
//       .json({ status: "success", message: data.message, link: data.link });
//   },
// );

// const resetPassword = catchAsync(
//   async (
//     req: Request<resetPasswordParamsDto, {}, resetPasswordDto>,
//     res: Response,
//   ) => {
//     const data = await resetPasswordService(req.body, req.params);

//     res.status(200).json({ status: "success", message: data.message });
//   },
// );

// const logout = catchAsync(async (req: Request, res: Response) => {
//   res.clearCookie("token", {
//     signed: true,
//     httpOnly: true,
//     secure: true,
//     path: "/",
//   });

//   res.status(200).json({ status: "success", message: "Logout successfully" });
// });

export { register };
