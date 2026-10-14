# Sample fixtures (development only)

These files use a made-up issuer ("Example Bank") and example.com links so the
/updates page can be previewed with every offer status. They are only read by
`pnpm preview:updates`, which writes to the git-ignored `.preview/` folder.
They never reach the live site. Dates like `{{today+7}}` are filled in at
build time, so the statuses stay the same whenever you preview.
