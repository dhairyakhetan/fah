// Site-wide settings and copy: the one place for the site's own address and its outside links.
// Leave a text field '' and the design's placeholder shows instead.
export const SITE = {
  // 2–3 lines under "Notes from where the land meets the water." on the home page (the phone card fits 3, no more)
  intro: 'TerraNotes is Aquaterra’s monthly magazine: stories, research, fashion, photos and art.',
  instagram: 'ngo.aquaterra', // Aquaterra's handle, without the @ (web header, phone menu)
  // where TerraNotes is served, no trailing slash. Inside AQ it is the main site's /terranotes; the build's link
  // previews, canonicals, sitemap and llms.txt take the origin from scripts/prerender-meta.mjs (env SITE_URL overrides).
  url: 'https://www.ngoaquaterra.com/terranotes',
  website: 'https://www.ngoaquaterra.com', // Aquaterra's main site (llms.txt)
};

