# build — working data, not part of the published site

Kept in the repo so the remaining work can be done from anywhere,
including a cloud session with no access to the original files.

```
thumbs/<project>/     460px preview of every candidate image, for choosing covers
manifest.json         every project, its source folder, and its candidate files
picks.json            the chosen cover per project
docs.json             the PDFs copied into assets/docs, with original sizes
pages.json            the generated project pages
```

`assets/` is generated from the originals in `Documents/portfolio`
(2.3 GB, not in this repo). Everything here is derived and web-sized;
regenerating it needs that folder, but editing the site does not.
