const module_name = "sctg";
const config = {
    input: "src/index.js",    
    output: {
      file: `docs/${module_name}.js`,
      format: "umd",
      name: module_name
    },
    plugins: []
  };
  
  export default [
    config,
    {
      ...config,
      output: {
        ...config.output,
        file: `docs/${module_name}.min.js`,
        compact: true
      },
      plugins: [
        ...config.plugins,
      ]
    }
  ];