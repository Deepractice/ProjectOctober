module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.scripts) {
        // Allow build scripts for native modules
        if (['bcrypt', 'better-sqlite3', 'esbuild', 'node-pty', 'sharp', 'sqlite3'].includes(pkg.name)) {
          pkg.allowBuild = true
        }
      }
      return pkg
    }
  }
}
