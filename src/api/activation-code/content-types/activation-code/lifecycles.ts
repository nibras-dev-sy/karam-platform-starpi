export default {
    async beforeCreate(event: any) {
      const { data } = event.params;
  
      // Generate formatted activation code
      let unique = false;
      let generatedCode = '';
  
      const randomString = (length: number) =>
        Array.from({ length }, () =>
          Math.random().toString(36).charAt(2).toUpperCase()
        ).join('');
  
      while (!unique) {
        const year = new Date().getFullYear();
        generatedCode = `ACT-${year}-${randomString(4)}`;
  
        const existing = await strapi.entityService.findMany('api::activation-code.activation-code', {
          filters: { code: generatedCode },
        });
  
        if (!existing || existing.length === 0) {
          unique = true;
        }
      }
  
      data.code = generatedCode;
      data.is_used = false;
      data.used_user = [];
    },
  };
  