# Contributing to ImgLink

Thank you for your interest in contributing to ImgLink! We welcome contributions from the community and are grateful for any help you can provide.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/briankwest/imglink/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - System information (OS, browser, etc.)

### Suggesting Features

1. Check if the feature has been suggested in [Issues](https://github.com/briankwest/imglink/issues)
2. Create a new issue with the "enhancement" label
3. Provide:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Update documentation if required
6. Commit with descriptive messages:
   ```bash
   git commit -m "feat: add image tagging functionality"
   ```
7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. Create a Pull Request

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development

1. Clone your fork:
   ```bash
   git clone https://github.com/briankwest/imglink.git
   cd imglink
   ```

2. Start the development environment:
   ```bash
   ./deploy.sh dev
   ```

3. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```

### Running Tests

#### Backend Tests
```bash
cd backend
python -m pytest
# With coverage
python -m pytest --cov=app tests/
```

#### Frontend Tests
```bash
cd frontend
npm test
# Watch mode
npm test -- --watch
```

## Coding Standards

### Python (Backend)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use type hints for function parameters and returns
- Maximum line length: 88 characters (Black default)
- Use meaningful variable names
- Add docstrings to functions and classes

Example:
```python
from typing import Optional, List

def process_image(
    file_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None
) -> dict:
    """
    Process an uploaded image file.
    
    Args:
        file_path: Path to the image file
        width: Target width in pixels
        height: Target height in pixels
        
    Returns:
        Dictionary containing processed image metadata
    """
    # Implementation here
    pass
```

### TypeScript/React (Frontend)

- Use TypeScript for all new code
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components with hooks
- Keep components small and focused
- Use meaningful prop names

Example:
```typescript
interface ImageCardProps {
  image: Image;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export function ImageCard({ 
  image, 
  onDelete, 
  showActions = true 
}: ImageCardProps) {
  // Component implementation
}
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add bulk image upload functionality
fix: resolve memory leak in image processing
docs: update API documentation for albums endpoint
refactor: simplify authentication middleware
```

## Testing Guidelines

### Backend Testing

- Write unit tests for all new functions
- Use pytest fixtures for common test data
- Mock external services (S3, email, etc.)
- Aim for >80% code coverage

### Frontend Testing

- Write component tests using React Testing Library
- Test user interactions, not implementation details
- Mock API calls
- Write E2E tests for critical user flows

## Documentation

- Update README.md if adding new features
- Document new API endpoints in docs/API.md
- Add JSDoc/docstrings for new functions
- Update environment variable documentation
- Include examples for complex features

## Review Process

1. All PRs require at least one review
2. CI must pass (tests, linting, building)
3. No merge conflicts
4. Documentation updated
5. Follows coding standards

## Release Process

1. Features are merged to `main`
2. Releases are tagged using semantic versioning
3. Changelog is updated
4. Docker images are built and tagged

## Getting Help

- Check existing documentation
- Look for similar issues/PRs
- Ask in GitHub Discussions
- Contact maintainers if needed

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in commit messages

Thank you for contributing to ImgLink! 🚀