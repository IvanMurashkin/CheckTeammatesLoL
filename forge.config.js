module.exports = {
  makers: [
    {
      name: '@rabbitholesyndrome/electron-forge-maker-portable',
      config: {
        win: {
          certificateFile: 'CheckTeammatesLoL.pfx',
          certificatePassword: process.env.CERT_PASSWORD,
        },
      },
    },
  ],
};
