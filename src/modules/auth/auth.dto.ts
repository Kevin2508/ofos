interface registerDto {
  userName: string;
  fullName: string;
  bio: string;
  email: string;
  contact: string;
  website: string;
  birthDate: string;
  location: string;
  timeZone: string;
  password: string;
  confirmPassword: string;
}

interface loginDto {
  userIdentifier: string;
  password: string;
  rememberMe: string;
}

interface forgotPasswordDto {
  userIdentifier: string;
}

interface resetPasswordDto {
  password: string;
  confirmPassword: string;
}

interface resetPasswordParamsDto {
  resetToken: string;
}

interface sendOtpDto {
  email: string;
}

interface verigyOtpDto {
  email: string;
  otp: string;
}

export {
  forgotPasswordDto,
  loginDto,
  registerDto,
  resetPasswordDto,
  resetPasswordParamsDto,
  sendOtpDto,
  verigyOtpDto,
};
