/**
 * HTML Analysis Script
 * 
 * This script analyzes saved HTML files to determine the right CSS selectors
 * for the product crawler.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths to the saved HTML files
const HTML_DIR = path.join(process.cwd(), 'crawl-results');
const datorHTML = path.join(HTML_DIR, 'www_kjell_com__se_produkter_dator_datorkomponenter.html');
const belysningHTML = path.join(HTML_DIR, 'www_kjell_com__se_produkter_hem-kontor_kontorsbelysning.html');

function analyzeLinks(html, url) {
  const $ = cheerio.load(html);
  console.log(`\nAnalyzing links in ${url}:`);
  
  // Find all link elements
  console.log('Total links on page:', $('a').length);
  
  // Find links containing 'produkt'
  const productLinks = $('a[href*="produkt"]');
  console.log('Links containing "produkt":', productLinks.length);
  
  // Sample product links
  console.log('\nSample product links:');
  productLinks.slice(0, 5).each((i, el) => {
    console.log($(el).attr('href'), $(el).text().trim());
    // Print parent classes
    const parentClasses = [];
    $(el).parents().each((i, parent) => {
      const classes = $(parent).attr('class');
      if (classes) parentClasses.push(classes);
    });
    console.log('Parent classes:', parentClasses.slice(0, 3).join(' > '));
  });
  
  // Analyze common parent classes for pattern detection
  const parentClassCounts = {};
  productLinks.each((i, el) => {
    const parent = $(el).parent();
    const parentClass = parent.attr('class');
    if (parentClass) {
      parentClassCounts[parentClass] = (parentClassCounts[parentClass] || 0) + 1;
    }
  });
  
  console.log('\nCommon parent classes of product links:');
  Object.entries(parentClassCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([cls, count]) => {
      console.log(`${cls}: ${count} links`);
    });
  
  // Analyze common link classes
  const linkClassCounts = {};
  productLinks.each((i, el) => {
    const linkClass = $(el).attr('class');
    if (linkClass) {
      linkClassCounts[linkClass] = (linkClassCounts[linkClass] || 0) + 1;
    }
  });
  
  console.log('\nCommon classes of product links:');
  Object.entries(linkClassCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([cls, count]) => {
      console.log(`${cls}: ${count} links`);
    });
  
  // Analyze data attributes
  const linkDataAttrs = {};
  productLinks.each((i, el) => {
    Object.keys($(el)[0].attribs || {})
      .filter(attr => attr.startsWith('data-'))
      .forEach(attr => {
        linkDataAttrs[attr] = (linkDataAttrs[attr] || 0) + 1;
      });
  });
  
  if (Object.keys(linkDataAttrs).length > 0) {
    console.log('\nCommon data attributes of product links:');
    Object.entries(linkDataAttrs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([attr, count]) => {
        console.log(`${attr}: ${count} links`);
      });
  }
  
  // Suggest selectors
  console.log('\nSuggested product link selectors:');
  
  const suggestions = [];
  
  // Based on parent classes
  const topParentClasses = Object.entries(parentClassCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cls]) => cls.split(/\s+/)[0]); // Get first class name
  
  topParentClasses.forEach(cls => {
    suggestions.push(`.${cls} a[href*="produkt"]`);
  });
  
  // Based on link classes
  const topLinkClasses = Object.entries(linkClassCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cls]) => cls.split(/\s+/)[0]); // Get first class name
  
  topLinkClasses.forEach(cls => {
    suggestions.push(`a.${cls}[href*="produkt"]`);
  });
  
  // Based on data attributes
  const topDataAttrs = Object.keys(linkDataAttrs).slice(0, 2);
  topDataAttrs.forEach(attr => {
    suggestions.push(`a[${attr}][href*="produkt"]`);
  });
  
  // General selector
  suggestions.push('a[href*="produkt"]');
  
  console.log(suggestions.join(',\n'));
  
  return suggestions;
}

function analyzePagination(html, url) {
  const $ = cheerio.load(html);
  console.log(`\nAnalyzing pagination in ${url}:`);
  
  // Look for common pagination patterns
  const paginationSelectors = [
    '.pagination a',
    'nav.pagination a',
    'ul.pagination a',
    '.pager a',
    'a[href*="page="]',
    'a[href*="sida="]'
  ];
  
  paginationSelectors.forEach(selector => {
    const count = $(selector).length;
    console.log(`${selector}: ${count} elements`);
  });
  
  // Suggest selector
  console.log('\nSuggested pagination selectors:');
  const suggestions = paginationSelectors.filter(selector => $(selector).length > 0);
  if (suggestions.length === 0) {
    suggestions.push('a[href*="page="], a[href*="sida="]');
  }
  
  console.log(suggestions.join(',\n'));
  return suggestions;
}

async function main() {
  try {
    // Analyze dator page
    if (fs.existsSync(datorHTML)) {
      const html = fs.readFileSync(datorHTML, 'utf8');
      analyzeLinks(html, 'datorkomponenter');
      analyzePagination(html, 'datorkomponenter');
    } else {
      console.error(`Could not find HTML file: ${datorHTML}`);
    }
    
    // Analyze belysning page
    if (fs.existsSync(belysningHTML)) {
      const html = fs.readFileSync(belysningHTML, 'utf8');
      analyzeLinks(html, 'kontorsbelysning');
      analyzePagination(html, 'kontorsbelysning');
    } else {
      console.error(`Could not find HTML file: ${belysningHTML}`);
    }
    
    console.log('\nAnalysis complete. Update your crawlConfigs.js with the suggested selectors.');
    
  } catch (error) {
    console.error('Error analyzing HTML:', error);
  }
}

main(); 