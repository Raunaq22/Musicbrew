/**
 * Global Color Palette Configuration
 * 
 * This file contains all the color definitions for the MusicBrew application.
 * To change the color scheme, simply update the values in this file.
 * 
 * The colors will automatically be applied throughout the application
 * through Tailwind CSS custom colors and React context.
 */

export const colors = {
  // Primary Colors
  primary: '#8b5cf6',        // Purple - Accent, buttons, highlights
  primaryHover: '#a78bfa',   // Lightened purple for hover states
  
  // Secondary Colors
  secondary: '#581c87',      // Deep Purple - Secondary buttons, active icons
  
  // Background Colors
  background: '#18181b',     // Dark background - App background/main surfaces
  card: '#23233a',           // Card/Panel - Cards, containers, navbar
  
  // Accent Colors
  accent: '#c084fc',         // Highlight purple - Badges, links, focus states
  
  // Text Colors
  textLight: '#f3f4f6',      // Primary text on dark backgrounds
  textMuted: '#a1a1aa',      // Secondary text, placeholders
};

/**
 * Tailwind CSS color configuration object
 * Use this in tailwind.config.js
 */
export const tailwindColors = {
  primary: {
    DEFAULT: colors.primary,
    hover: colors.primaryHover,
    dark: colors.secondary,
  },
  accent: colors.accent,
  background: colors.background,
  card: colors.card,
  text: {
    light: colors.textLight,
    muted: colors.textMuted,
  },
};

export default colors;
