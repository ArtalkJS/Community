# Artalk Community Resources

[![Artalk](https://img.shields.io/badge/Artalk-Official-blue?style=flat-square)](https://artalk.js.org/) [![Releases](https://img.shields.io/github/release-date/ArtalkJS/Community?style=flat-square&label=Latest%20Updated)](https://github.com/ArtalkJS/Community/releases) [![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/ArtalkJS/Community/build_publish.yml?style=flat-square&label=Build%20Status)](https://github.com/ArtalkJS/Community/actions)

This repository contains the distribution resources for the [Artalk](https://github.com/ArtalkJS/Artalk) project, as well as our community plugins and themes.

Artalk is a open-source project that aims to provide a simple, fast and extensible commenting system for websites. You can easily create or install plugins and themes to customize the look and feel of your Artalk instance. A plugin guide is available in the [Documentation](https://artalk.js.org/develop/plugin.html).

The repo does not accept issues, if you han any questions or need help, please go to the [Main Repository](https://github.com/ArtalkJS/Artalk/issues).

## Submit your plugin or theme

Thanks for submitting your creations! We welcome all contributions to the Artalk ecosystem.

Before you start, make sure you have read the [Plugin Guide](https://artalk.js.org/develop/plugin.html) and [Theme Guide](https://artalk.js.org/develop/theme.html).

Assuming you have already created your plugin or theme, and published it to [NPM](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry), you can now submit it to this repository.

To submit your plugin or theme, please follow these steps:

1. Fork this repository.
2. Edit `plugins.yaml` or `themes.yaml` in the root directory of your forked repository.
3. Add your plugin or theme to the list, following the format of the existing entries.

   ```yaml
   - id: 'artalk-plugin-sample'
     name: 'Sample Plugin'
     description: 'Sample Plugin of Artalk'
     github_repo: 'ArtalkJS/Artalk'
     npm_package: 'artalk-plugin-sample'
     author_name: 'ArtalkOfficial'
     author_link: 'https://github.com/ArtalkJS/Artalk'
     donate_link: 'https://buymeacoffee.com/artalk'
   ```

4. Execute `pnpm install` and `pnpm lint` to check if the changes are correct (Github Actions will also check it for you).
5. Submit a pull request to this repository.

### How it works

- Artalk will read the `plugins.yaml` and `themes.yaml` files in this repository to display the list of available plugins and themes.
- After you updated the list, Artalk will automatically fetch the latest data from your `github_repo` and `npm_package` to get the information about your plugin or theme.
- The `id` field is used to uniquely identify your plugin or theme. It should be a unique string that is not used by any other plugin or theme in this repository.
- Your github plugin repository should contain a `README.md` file that describes your plugin or theme. This file will be displayed in the Artalk plugin or theme page.
- Your node repo should contain a `package.json` file, and managed by NPM. We provide [Artalk Vite Plugin](https://www.npmjs.com/package/@artalk/plugin-kit) to help you build and keep your plugin or theme manifest information consistent with Artalk. A github repo template is available [here](https://github.com/ArtalkJS/artalk-plugin-sample), we recommend you to use it.
