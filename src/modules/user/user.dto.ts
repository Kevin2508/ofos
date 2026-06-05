interface IeditUserProfileDto {
  fullName: string;
  bio: string;
  location: string;
  website: string;
  birthDate: string;
}

interface IchangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface IserachParamsDto {
  searchString: string;
}

interface IcheckEmail {
  email: string;
}

interface IcheckUsername {
  userName: string;
}

export {
  IchangePasswordDto,
  IcheckEmail,
  IcheckUsername,
  IeditUserProfileDto,
  IserachParamsDto,
};
