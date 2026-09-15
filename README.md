# DorkSeek
Graphical Google Dorks browser tool for Google.

_Link to the tool_: https://ende25.github.io/DorkSeek/

This simple tool programmed in HTML and JavaScript allows you to use the potential of Google Dorks for OSINT and advanced internet navigation through a simple graphical interface, freeing you from having to retain all the commands in your memory.

![imagen](https://github.com/user-attachments/assets/5fefd9dd-7518-484d-be6f-dbeabaf15c63)


### What is Google Dorks?
Google Dorks or Dorking, also known as Google Hacking, is a technique that consists of applying Google's advanced search to find specific information on the Internet by filtering the results with operators known as Dorks, which are symbols that specify a condition. For example, if we put double quotes (“text”) in our search text, it will search for information that exactly matches the text. That is, if we search for “OSI”, it will return the content that exactly matches that term.

Google only documents a handful of these operators officially (`filetype:`, `site:`, quotes, `-`, `before:`/`after:`); the rest (`intitle:`, `inurl:`, `OR`, `allin*`...) work in practice and are confirmed by extensive third-party testing, but can change or stop working without notice since Google doesn't commit to them.

## AND vs OR: how multiple tags combine
Google's default behavior for multiple terms in a query is **implicit AND** — space-separating terms (or repeating an operator, e.g. `inurl:admin inurl:login`) requires all of them to be present. `OR` (capitalized) is a separate, real operator confirmed to work reliably, but it is **not** part of Google's own documented syntax.

This tool uses that distinction to decide how multiple tags combine in the same field:
- **`site:` and `filetype:` combine with OR.** These describe a single-valued attribute a page can only have one of at a time (a page lives on one domain, a file is one type), so "either of these" is the only sensible way to combine more than one — asking for a page to be on two domains at once, or be two file types at once, is impossible.
- **Every other multi-value field (`intitle:`, `inurl:`, `intext:`, `define:`, exact match) combines with AND.** These describe content that can all be true on the same page at once, and the standard, well-established dork convention for "give me a page with all of these" is to repeat the operator space-separated — exactly what Google itself treats as implicit AND.

## Multi-value fields and Enter
Most filter fields work as tag inputs: type a value and press **Enter** to add it as a removable tag (click its `×` to remove, or press Backspace on an empty field to remove the last one). You can add several tags to the same field. Any text still being typed (not yet confirmed with Enter) is included too if you click "Search on Google" directly.

Pressing **Enter** only triggers the search when no field has focus (e.g. right after loading the page, or after clicking away from any input) — this lets you use Enter to add tags without accidentally launching a search. The main search bar at the top is the exception: Enter there always searches immediately, since it's free-text, not a tag field.

## Summary of the Dorks implemented in this tool
- **File type (filetype:)**
  Searches for one or more file types in the results, combined with OR.
  Example: `pdf` + Enter, then `doc` + Enter, builds `(filetype:pdf OR filetype:doc OR filetype:docx)`.
  For extensions with common variants that Google does **not** group together (doc/docx, xls/xlsx, ppt/pptx, html/htm, jpg/jpeg, tiff/tif, xsl/xslt, yml/yaml), each tag automatically expands to include its variant.

- **Exact match ("")**
  Searches for pages that contain the exact text of every tag — all of them are required, not just one.
  Example: `exact text` + Enter builds `"exact text"`; a second tag `other text` builds `"exact text" "other text"`.

- **Domain (site:)**
  Limits results to one or more domains or websites, combined with OR (a page can only be on one domain at a time).
  Example: `example.com` + Enter builds `site:example.com`; adding `other.com` builds `(site:example.com OR site:other.com)`.

- **Title contains (intitle:)**
  Searches for pages where the title contains every tag — all of them are required. Multi-word tags are automatically quoted so Google treats them as a phrase instead of scoping only the first word.
  Example: `index of` + Enter becomes `intitle:"index of"`; adding `backup` builds `intitle:"index of" intitle:backup`.

- **URL contains (inurl:)**
  Searches for pages where the URL contains every tag (auto-quoted for multi-word tags, same as `intitle:`; all tags required).
  Example: `admin` + Enter, then `login` + Enter, builds `inurl:admin inurl:login`.

- **Text (intext:)**
  Searches for pages that contain every tag in the body (auto-quoted for multi-word tags; all tags required).
  Example: `text in body` + Enter becomes `intext:"text in body"`.

- **All in URL (allinurl:)**
  Searches for pages where the URL contains ALL the tags, joined as words inside a single `allinurl:` clause rather than as repeated operator instances (that's simply how `allinurl:` itself already works). Do not combine with other operators in the same query — Google's own behavior is unreliable when `allin*` is mixed with filters like `site:` or `intitle:`. The tool shows a warning if you do this.

- **All in title (allintitle:)**
  Searches for pages whose title contains ALL the tags. Same space-joined (AND) behavior and combination warning as `allinurl:`.

- **All in text (allintext:)**
  Searches for pages whose body contains ALL the tags. Same space-joined (AND) behavior and combination warning as `allinurl:`.

- **Define (define:)**
  Searches for definitions of terms directly in Google; all tags are required if you add more than one. Undocumented by Google and of little practical use for OSINT, but harmless to keep.
  Example: `example` + Enter shows the definition of "example".

- **Exclude domain (-site:)**
  Excludes results from one or more domains or sites, one tag per domain.
  Example: `example.com` + Enter excludes pages from example.com.

- **Exclude term (-)**
  Excludes results containing one or more terms, one tag per term.
  Example: `forum` + Enter, then `login` + Enter, builds `-forum -login`.

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
