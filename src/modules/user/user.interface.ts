interface IfunctionReturn {
  message: string;
  data?: [];
  user?: Iuser;
  isAvailable?: Boolean;
  joiningData?: IjoiningData;
  followed?: boolean;
}

interface IjoiningData {
  created_at: string;
  username_changes_count: string;
  last_username_change: string;
}

interface Iuser {
  user_id: string;
  user_name: string;
  email: string;
  u_password: string;
  time_zone: string;
  isFollowed: boolean;
  profile_picture?: string;
  cover_picture?: string;
}

export { Iuser, IjoiningData, IfunctionReturn };
