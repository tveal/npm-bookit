0c9d04ea-7f50-4e83-9bc4-6c87ebf60e24

## Install/Test Plugin From Source

1. In a new/empty folder, initialize a new npm package
    ```
    npm init -y
    ```

2. Clone this repo to a subfolder, "plugin", and change directory to it
    ```
    git clone https://github.com/tveal/npm-bookit.git plugin
    cd plugin/
    ```

3. (Optional) checkout to a different branch in the plugin
    ```
    git checkout first-draft
    ```

4. Install deps, build plugin, then move back to the parent directory
    ```
    npm ci
    npm run build
    cd ..
    ```

5. Install the plugin to your new npm package
    ```
    npm i plugin/
    ```

When you make changes to the plugin, you'll need to repeat the following steps to get the changes in your npm package

1. Build the plugin
    ```
    cd plugin/
    npm run build
    cd ..
    ```

2. Install the newly built plugin
    ```
    npm i plugin/
    ```
