import React from 'react';
import { SidebarPortal, BlockDataForm } from '@plone/volto/components';
import schema from './schema';
import View from './View';

const Edit = ({ data, block, onChangeBlock, selected }) => {
  const fullSchema = schema();
  const currentView = data?.chartType;

  // Build a filtered schema that drives progressive disclosure:
  //
  //   1. Filter fieldsets by their condition function (file linked? view chosen?)
  //   2. Within each visible fieldset, filter out fields whose viewTypes array
  //      doesn't include the current chartType. Fields with no viewTypes are
  //      always shown (title, caption, independent, etc.)
  //
  const filteredSchema = {
    ...fullSchema,
    fieldsets: fullSchema.fieldsets
      // Step 1: hide fieldsets whose condition isn't met
      .filter((fs) => !fs.condition || fs.condition(data))
      // Step 2: strip irrelevant fields within each visible fieldset
      .map((fs) => ({
        ...fs,
        fields: fs.fields.filter((fieldId) => {
          const fieldDef = fullSchema.properties[fieldId];
          if (!fieldDef) return false;
          // No viewTypes = always show in this fieldset
          if (!fieldDef.viewTypes) return true;
          // Has viewTypes = only show if current view is in the list
          return currentView && fieldDef.viewTypes.includes(currentView);
        }),
      }))
      // Step 3: drop any fieldset that ends up with no fields
      // (avoids rendering an empty tab, e.g. "Labels & text" for a stats view)
      .filter((fs) => fs.fields.length > 0),
  };

  return (
    <>
      <View data={data} block={block} />
      {selected && (
        <SidebarPortal selected={selected}>
          <BlockDataForm
            schema={filteredSchema}
            title="Data Visualisation"
            onChangeField={(id, value) =>
              onChangeBlock(block, { ...data, [id]: value })
            }
            block={block}
            formData={data}
          />
        </SidebarPortal>
      )}
    </>
  );
};

export default Edit;
