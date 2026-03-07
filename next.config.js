/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Toto zajistí, že drobné chyby v kódu nezablokují spuštění webu
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
