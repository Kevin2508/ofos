interface IfunctionReturn {
  message: string;
  token?: string;
  link?: string;
  otp?: string;
}

interface IrepositoryReturn {
  message: string;
  data?: IrowReturn;
}

interface IrowReturn {
  message: string;
  reset_token_id?: string;
  user_id?: string;
  token?: string;
  otp_id?: string;
  email?: string;
  otp?: string;
  expires_at: string;
  attempts?: string;
}

export { IfunctionReturn, IrepositoryReturn, IrowReturn };
