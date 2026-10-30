import * as THREE from 'three';

const artworkSources = {
  genghis: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/YuanEmperorAlbumGenghisPortrait.jpg/1280px-YuanEmperorAlbumGenghisPortrait.jpg',
  empire: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Genghis_khan_empire_at_his_death.png',
  terelj: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Mongolia-terelj.jpg',
  horses: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Herd_of_Mongolian_Wild_Horse_%288367788369%29.jpg',
  gobi: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Gobi%2C_krajobraz_pustyni_%2809%29.jpg',
};

// Loads historical and landscape images from Wikimedia Commons.
export function loadArtworks(onProgress) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress(Math.round((loaded / total) * 100));
  const loader = new THREE.TextureLoader(manager);
  loader.setCrossOrigin('anonymous');

  const loadTexture = (url) => new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        resolve(texture);
      },
      undefined,
      () => reject(new Error(`Could not load artwork: ${url}`)),
    );
  });

  return Promise.all([
    loadTexture(artworkSources.genghis),
    loadTexture(artworkSources.empire),
    loadTexture(artworkSources.terelj),
    loadTexture(artworkSources.horses),
    loadTexture(artworkSources.gobi),
  ]).then(([genghis, empire, terelj, horses, gobi]) => ({
    genghis,
    empire,
    terelj,
    horses,
    gobi,
  }));
}
