# Campbell Smith — portfolio

Static site. No build step: open `index.html`, or serve the folder.

```
index.html           home
full-portfolio.html  all work, grouped into seven disciplines
projects/            one page per project (26)
assets/
  projects/<slug>/   gallery images, 1400px
  docs/<slug>/       project documents (PDF)
  sun.png            logo
  about.jpg
style.css            all styles
app.js               skills marquee, header font cycle, contact address, PDF viewers
```

Source material lives separately in `Documents/portfolio`; everything in
`assets/` is generated from it at web resolution.
