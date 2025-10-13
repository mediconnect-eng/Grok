// tailwind.brand.extend.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {50:'#F0FDFB',100:'#CCFBF1',200:'#99F6E4',300:'#5EEAD4',400:'#2DD4BF',500:'#14B8A6',600:'#0F766E',700:'#0B5B55',800:'#094741',900:'#073B36'},
        secondary: {600:'#4F46E5'},
        accent: {500:'#F59E0B'},
        success:'#16A34A', warning:'#D97706', error:'#DC2626', info:'#2563EB',
        ink:'#111827', body:'#374151', subtle:'#6B7280', border:'#E5E7EB',
        surface:'#FFFFFF', surfaceAlt:'#F9FAFB'
      },
      boxShadow: { card: '0 1px 2px rgba(17,24,39,.06), 0 4px 12px rgba(17,24,39,.06)' },
      borderRadius: { xl: '1rem', '2xl':'1.25rem' }
    }
  }
}
