# Karan contrast checker

## Contrast Checker Application

This repository contains a web application that allows you to test the contrast ratio between two colors.
You can enter colors as named CSS values (e.g., "red", "blue") or as hex codes prefixed with "#", like "#ffffff".

### Key Features

- **Color Input Flexibility**: Supports CSS named colors or hex codes (with "#").
- **Live Preview**: Shows a real-time preview of text with the chosen foreground and background colors.
- **Language Toggle**: Easily switch between Japanese (default) and English interfaces.
- **Responsive and Accessible**: Designed with accessibility in mind and responsive layout using Tailwind CSS.

### How to Use

1. Run the application using `npm run dev` or your preferred command.
2. Open the provided local URL in your browser.
3. Enter valid color values into both Foreground and Background fields.
4. Check the live preview on the right side (or left side, depending on the final layout).
5. Submit the form to get the final contrast calculation and compliance levels.

### Technologies Used

- **Remix Framework**: For server-side rendering and routing.
- **Tailwind CSS**: For a clean and responsive UI.
- **TypeScript**: For type safety and maintainable code.
