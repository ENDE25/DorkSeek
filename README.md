# DorkSeek
Graphical Google Dorks browser tool for Google.

_Link to the tool_: https://ende25.github.io/DorkSeek/

This simple tool programmed in HTML allows you to use the potential of Google Dorks for OSINT and advanced internet navigation through a simple graphical interface, freeing you from having to retain all the commands in your memory.

### What is Google Dorks?
Google Dorks or Dorking, also known as Google Hacking, is a technique that consists of applying Google's advanced search to find specific information on the Internet by filtering the results with operators known as Dorks, which are symbols that specify a condition. For example, if we put double quotes (“text”) in our search text, it will search for information that exactly matches the text. That is, if we search for “OSI”, it will return the content that exactly matches that term. Throughout this article we will show you how it can be useful to you.

## Summary of the Dorks implemented in this tool
- **File type (filetype:)**  
  Searches for a specific type of file in the results.  
  Example: `filetype:pdf` finds PDF files.
  To enter multiple terms, they must be separated with " ". (e.g. username" "password" "login)

- **Exact match ("")**  
  Searches for pages that contain the exact text within the quotes.  
  Example: `"exact text"` searches for the exact phrase on pages.

- **Domain (site:)**  
  Limits results to a specific domain or website.  
  Example: `site:example.com` searches only in example.com.

- **Title contains (intitle:)**  
  Searches for pages where the title contains specific words.  
  Example: `intitle:title text` searches for pages with "title text" in their title.

- **URL contains (inurl:)**  
  Searches for pages where the URL contains specific words.  
  Example: `inurl:text in URL` finds URLs that contain "text in URL".

- **Text (intext:)**  
  Searches for pages that contain specific text in the body.  
  Example: `intext:text in body` searches for pages with that text in their content.

- **Cache version (cache:)**  
  Displays the cached version of a webpage stored by Google.  
  Example: `cache:example.com` shows the saved copy of example.com.

- **Contains links to (link:)**  
  Searches for pages that link to a specific site or URL.  
  Example: `link:example.com` shows sites that contain links to example.com.

- **Related sites (related:)**  
  Finds websites related to a specific domain.  
  Example: `related:example.com` shows sites similar to example.com.

- **All in URL (allinurl:)**  
  Searches for pages where the URL contains all specified words.  
  Example: `allinurl:text in URL` searches for URLs that contain all those words.

- **All in title (allintitle:)**  
  Searches for pages whose title contains all specified words.  
  Example: `allintitle:title text` searches for pages with all those words in their title.

- **All in text (allintext:)**  
  Searches for pages whose body contains all specified words.  
  Example: `allintext:text in body` searches for pages with all those words in their content.

- **Define (define:)**  
  Searches for definitions of terms directly in Google.  
  Example: `define:example` shows the definition of "example".

- **Info (info:)**  
  Displays information about a specific website.  
  Example: `info:example.com` shows details about example.com.

- **Exclude domain (-site:)**  
  Excludes results from a specific domain or site.  
  Example: `-site:example.com` excludes pages from example.com.

- **Before (before:)**  
  Limits results to pages published before a specific date.  
  Example: `before:01/01/2023` searches for pages prior to that date.

- **After (after:)**  
  Limits results to pages published after a specific date.  
  Example: `after:01/01/2023` searches for pages after that date.
