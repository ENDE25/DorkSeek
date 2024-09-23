# DorkSeek
Graphical Google Dorks browser tool for Google.

This simple tool programmed in HTML allows you to use the potential of Google Dorks for OSINT and advanced internet navigation through a simple graphical interface, freeing you from having to retain all the commands in your memory.

### What is Google Dorks?
Google Dorks or Dorking, also known as Google Hacking, is a technique that consists of applying Google's advanced search to find specific information on the Internet by filtering the results with operators known as Dorks, which are symbols that specify a condition. For example, if we put double quotes (“text”) in our search text, it will search for information that exactly matches the text. That is, if we search for “OSI”, it will return the content that exactly matches that term. Throughout this article we will show you how it can be useful to you.

## Summary of the Dorks implemented in this tool
- Tipo de archivo (filetype:)
Busca un tipo específico de archivo en los resultados.
Ejemplo: filetype:pdf encuentra archivos PDF.

- Coincidencia exacta ("")
Busca páginas que contengan el texto exacto dentro de las comillas.
Ejemplo: "texto exacto" busca la frase exacta en las páginas.

- Dominio (site:)
Limita los resultados a un dominio o sitio web específico.
Ejemplo: site:example.com busca solo en example.com.

- Título contiene (intitle:)
Busca páginas donde el título contenga palabras específicas.
Ejemplo: intitle:texto del título busca páginas con "texto del título" en su título.

- URL contiene (inurl:)
Busca páginas donde la URL contenga palabras específicas.
Ejemplo: inurl:texto en URL encuentra URLs que contengan "texto en URL".

- Texto (intext:)
Busca páginas que contengan texto específico en el cuerpo.
Ejemplo: intext:texto en el cuerpo busca páginas con ese texto en su contenido.

- Versión en cache (cache:)
Muestra la versión en caché de una página web almacenada por Google.
Ejemplo: cache:example.com muestra la copia guardada de example.com.

- Contiene enlaces a (link:)
Busca páginas que enlacen a un sitio o URL específico.
Ejemplo: link:example.com muestra sitios que contienen enlaces a example.com.

- Sitios relacionados con (related:)
Encuentra sitios web relacionados con un dominio específico.
Ejemplo: related:example.com muestra sitios similares a example.com.

- Todo en URL (allinurl:)
Busca páginas donde la URL contenga todas las palabras especificadas.
Ejemplo: allinurl:texto en URL busca URLs que contengan todas esas palabras.

- Todo en título (allintitle:)
Busca páginas cuyo título contenga todas las palabras especificadas.
Ejemplo: allintitle:texto del título busca páginas con todas esas palabras en su título.

- Todo en texto (allintext:)
Busca páginas cuyo cuerpo contenga todas las palabras especificadas.
Ejemplo: allintext:texto en el cuerpo busca páginas con todas esas palabras en su contenido.

- Definir (define:)
Busca definiciones de términos directamente en Google.
Ejemplo: define:ejemplo muestra la definición de "ejemplo".

- Información (info:)
Muestra información sobre un sitio web específico.
Ejemplo: info:example.com muestra detalles sobre example.com.

- Excluir dominio (-site:)
Excluye resultados de un dominio o sitio específico.
Ejemplo: -site:example.com excluye páginas de example.com.

- Antes (before:)
Limita los resultados a páginas publicadas antes de una fecha específica.
Ejemplo: before:01/01/2023 busca páginas anteriores a esa fecha.

- Después (after:)
Limita los resultados a páginas publicadas después de una fecha específica.
Ejemplo: after:01/01/2023 busca páginas posteriores a esa fecha.
