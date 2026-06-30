interface registerDto {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
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
  email?: string;
  phone?: string;
}

interface verigyOtpDto {
  email?: string;
  phone?: string;
  otp: string;
}

interface checkPhoneDto {
  phone: string;
}

interface checkEmailDto {
  email: string;
}

export {
  forgotPasswordDto,
  loginDto,
  registerDto,
  resetPasswordDto,
  resetPasswordParamsDto,
  sendOtpDto,
  verigyOtpDto,
  checkPhoneDto,
  checkEmailDto,
};
