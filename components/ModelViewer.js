'use client';
import { useEffect, useRef, useState } from 'react';

// STL / GLB / GLTF dosyasını fareyle (veya parmakla) döndürülebilir şekilde gösterir.
// url veya buffer (ArrayBuffer) + tur ('stl' | 'glb' | 'obj') verilir.
export default function ModelViewer({ url, buffer, tur, className = '', renk = '#E8620C' }) {
  const kap = useRef(null);
  const [durum, setDurum] = useState('yukleniyor');

  useEffect(() => {
    let iptal = false, temizle = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const el = kap.current;
        if (!el || iptal) return;
        const sahne = new THREE.Scene();
        const kamera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 10000);
        const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        r.setPixelRatio(Math.min(2, window.devicePixelRatio));
        r.setSize(el.clientWidth, el.clientHeight);
        el.appendChild(r.domElement);
        sahne.add(new THREE.HemisphereLight(0xffffff, 0xd9d6d0, 1.6));
        const isik = new THREE.DirectionalLight(0xffffff, 1.6); isik.position.set(1, 2, 1.5); sahne.add(isik);

        const uzanti = (tur || url?.split('?')[0].split('.').pop() || '').toLowerCase();
        let nesne;
        const malzeme = new THREE.MeshStandardMaterial({ color: renk, roughness: 0.55, metalness: 0.05 });
        const veri = buffer || (await (await fetch(url)).arrayBuffer());
        if (uzanti === 'glb' || uzanti === 'gltf') {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          nesne = await new Promise((ok, hata) => new GLTFLoader().parse(veri, '', (g) => ok(g.scene), hata));
        } else if (uzanti === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
          nesne = new OBJLoader().parse(new TextDecoder().decode(veri));
          nesne.traverse((c) => { if (c.isMesh) c.material = malzeme; });
        } else {
          const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
          const g = new STLLoader().parse(veri); g.computeVertexNormals();
          nesne = new THREE.Mesh(g, malzeme);
          nesne.rotation.x = -Math.PI / 2; // çoğu dilimleyici Z-yukarı kaydeder
        }
        if (iptal) return;
        const kutu = new THREE.Box3().setFromObject(nesne);
        const boyut = kutu.getSize(new THREE.Vector3()), merkez = kutu.getCenter(new THREE.Vector3());
        nesne.position.sub(merkez);
        const grup = new THREE.Group(); grup.add(nesne); sahne.add(grup);
        const uzak = Math.max(boyut.x, boyut.y, boyut.z) * 1.9;
        kamera.position.set(uzak * 0.8, uzak * 0.55, uzak);
        kamera.lookAt(0, 0, 0);
        const kontrol = new OrbitControls(kamera, r.domElement);
        kontrol.enableDamping = true; kontrol.autoRotate = true; kontrol.autoRotateSpeed = 1.6; kontrol.enablePan = false;
        kontrol.addEventListener('start', () => (kontrol.autoRotate = false));
        let raf;
        const dongu = () => { kontrol.update(); r.render(sahne, kamera); raf = requestAnimationFrame(dongu); };
        dongu();
        const boyutla = () => { kamera.aspect = el.clientWidth / el.clientHeight; kamera.updateProjectionMatrix(); r.setSize(el.clientWidth, el.clientHeight); };
        const ro = new ResizeObserver(boyutla); ro.observe(el);
        setDurum('hazir');
        temizle = () => { cancelAnimationFrame(raf); ro.disconnect(); kontrol.dispose(); r.dispose(); r.domElement.remove(); };
      } catch (e) {
        console.error(e);
        if (!iptal) setDurum('hata');
      }
    })();
    return () => { iptal = true; temizle(); };
  }, [url, buffer, tur, renk]);

  return (
    <div ref={kap} className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-krem to-white dark:from-lacivert-900 dark:to-lacivert-950 ${className}`}>
      {durum === 'yukleniyor' && <div className="soluk absolute inset-0 grid place-items-center text-sm">3D model yükleniyor…</div>}
      {durum === 'hata' && <div className="soluk absolute inset-0 grid place-items-center p-4 text-center text-sm">3D model gösterilemedi.</div>}
      {durum === 'hazir' && <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-lacivert-800 shadow">Döndürmek için sürükleyin</span>}
    </div>
  );
}
