# DorkSeek
Graphical Google Dorks browser tool for Google.

_Link to the tool_: https://ende25.github.io/DorkSeek/

This simple tool programmed in HTML and JavaScript allows you to use the potential of Google Dorks for OSINT and advanced internet navigation through a simple graphical interface, freeing you from having to retain all the commands in your memory.

![imagen](https://github.com/user-attachments/assets/5fefd9dd-7518-484d-be6f-dbeabaf15c63)


### What is Google Dorks?
Google Dorks or Dorking, also known as Google Hacking, is a technique that consists of applying Google's advanced search to find specific information on the Internet by filtering the results with operators known as Dorks, which are symbols that specify a condition. For example, if we put double quotes (“text”) in our search text, it will search for information that exactly matches the text. That is, if we search for “OSI”, it will return the content that exactly matches that term.

Google only documents a handful of these operators officially (`filetype:`, `site:`, quotes, `-`, `before:`); the rest (`intitle:`, `inurl:`, `OR`, `allin*`...) work in practice but can change or stop working without notice.

## Summary of the Dorks implemented in this tool
- **File type (filetype:)**
  Searches for a specific type of file in the results.
  Example: `filetype:pdf` finds PDF files.
  For extensions with common variants that Google does **not** group together (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt, yml/yaml), the tool automatically builds `(filetype:doc OR filetype:docx)` instead of a single `filetype:doc`.

- **Exact match ("")**
  Searches for pages that contain the exact text within the quotes.
  Example: `"exact text"` searches for the exact phrase on pages.

- **Domain (site:)**
  Limits results to one or more domains or websites. Multi-word values and comma-separated lists are supported.
  Example: `site:example.com` searches only in example.com. `a.com, b.com` builds `(site:a.com OR site:b.com)`.

- **Title contains (intitle:)**
  Searches for pages where the title contains the given text. If the value has several words, it is automatically quoted so Google treats it as a phrase instead of scoping only the first word.
  Example: `index of` becomes `intitle:"index of"`.

- **URL contains (inurl:)**
  Searches for pages where the URL contains the given text (auto-quoted for multi-word values, same as `intitle:`).
  Example: `admin panel` becomes `inurl:"admin panel"`.

- **Text (intext:)**
  Searches for pages that contain specific text in the body (auto-quoted for multi-word values).
  Example: `intext:"text in body"` searches for pages with that phrase in their content.

- **All in URL (allinurl:)**
  Searches for pages where the URL contains all specified words. Do not combine with other operators in the same query — Google's own behavior is unreliable when `allin*` is mixed with filters like `site:` or `intitle:`. The tool shows a warning if you do this.

- **All in title (allintitle:)**
  Searches for pages whose title contains all specified words. Same combination warning as `allinurl:`.

- **All in text (allintext:)**
  Searches for pages whose body contains all specified words. Same combination warning as `allinurl:`.

- **Define (define:)**
  Searches for definitions of terms directly in Google. Undocumented by Google and of little practical use for OSINT, but harmless to keep.
  Example: `define:example` shows the definition of "example".

- **Exclude domain (-site:)**
  Excludes results from one or more domains or sites (comma-separated).
  Example: `-site:example.com` excludes pages from example.com.

- **Exclude term (-)**
  Excludes results containing one or more terms (comma-separated).
  Example: `forum, login` becomes `-forum -login`.

- **Before (before:)**
  Limits results to pages published before a specific date. Format `YYYY-MM-DD`. Still officially "beta" since 2019 and results can be inconsistent, since many sites handle date metadata poorly.

- **After (after:)**
  Limits results to pages published after a specific date. Same caveats as `before:`.

- **_Exclude typical AI terms (heuristic)_**
  Checking this box appends a list of common AI-related keywords/domains (`chatgpt`, `copilot`, `bard`, `ai`, `generated`...) as exclusions. This is a keyword heuristic, not real AI-content detection: it does **not** identify AI-written text and can hide unrelated pages that simply mention those words. To remove Google's own AI layer (AI Overviews), use "Classic Web view" instead.

- **Classic Web view (no AI Overviews)**
  Appends the undocumented `udm=14` URL parameter, which shows Google's classic "Web" tab without AI Overviews or AI-generated summaries. Reverse-engineered, not officially documented, and can stop working without notice.

- **Literal mode (no synonyms)**
  Appends the undocumented `tbs=li:1` URL parameter, which disables synonym expansion and automatic spelling correction. Reverse-engineered, not officially documented, and can stop working without notice.

- **Google Drive / Docs search filter**
  Check the box to search for indexed Google Drive documents/folders and shared Google Docs/Sheets/Slides. This adds `(site:drive.google.com OR site:docs.google.com) -sign` to your search, showing only public results and filtering out sign-in pages.

## Removed operators
`cache:`, `link:`, `related:` and `info:` used to be available in this tool but have been removed: `cache:` stopped working around September 2024, `related:` was pulled from Google's documentation in July 2023 for being unsupported, and `link:`/`info:` have been deprecated since 2017 and no longer give reliable results. If you need a cached snapshot of a page, use the Wayback Machine instead.
