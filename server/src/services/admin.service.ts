interface AdminData {
  message: string;
}

interface IAdminService {
  getAdminData(): Promise<AdminData>;
}

const adminService: IAdminService = {
  async getAdminData(): Promise<AdminData> {
    return { message: 'Admin data retrieved successfully.' };
  },
};

export default adminService;
