export function getAppConfig() {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
  const accessTokenTtl = process.env.JWT_ACCESS_TTL;
  const refreshTokenTtl = process.env.JWT_REFRESH_TTL;

  // if (
  //   !accessTokenSecret ||
  //   !refreshTokenSecret ||
  //   !accessTokenTtl ||
  //   !refreshTokenTtl
  // ) {
  //   throw new Error('JWT auth configuration is missing');
  // }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenTtl,
    refreshTokenTtl,
  };
}
