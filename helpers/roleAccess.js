module.exports = {
  admin: {
    role_name: 'admin',
    role_access: []
  },
  user: {
    role_name: 'user',
    role_access: [
      {
        path: '/users',
        method: ['GET']
      },
      {
        path: '/users/:userId',
        method: ['GET']
      },
      {
        path: '/users/:userId/refresh_tokens',
        method: ['GET']
      },
      {
        path: '/users/refresh_token',
        method: ['POST']
      },
      {
        path: '/users/revoke_token',
        method: ['POST']
      },
    ]
  }
};
