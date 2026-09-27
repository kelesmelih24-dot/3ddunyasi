export default function manifest() {
  return {
    name: '3D Dünyası', short_name: '3D Dünyası',
    description: '3D baskı ürünleri, malzemeler ve size özel baskı',
    start_url: '/', display: 'standalone', background_color: '#FFFFFF', theme_color: '#E8620C', lang: 'tr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Özel sipariş', url: '/ozel-siparis' }, { name: 'Siparişlerim', url: '/hesabim' },
    ],
  };
}
