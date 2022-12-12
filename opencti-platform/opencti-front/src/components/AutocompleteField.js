import React from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { Add } from '@mui/icons-material';
import MUIAutocomplete from '@mui/material/Autocomplete';
import { fieldToTextField } from 'formik-mui';
import { useField } from 'formik';
import { isNil } from 'ramda';
import { useFormatter } from './i18n';

const AutocompleteField = (props) => {
  const {
    form: { setFieldValue, setTouched },
    field: { name },
    onChange,
    onFocus,
    noOptionsText,
    renderOption,
    textfieldprops,
    openCreate,
  } = props;
  const { t } = useFormatter();

  const [, meta] = useField(name);
  const internalOnChange = React.useCallback(
    (_, value) => {
      setFieldValue(name, value);
      if (typeof onChange === 'function') {
        onChange(name, value || '');
      }
    },
    [setFieldValue, name, onChange],
  );
  const internalOnFocus = React.useCallback(() => {
    if (typeof onFocus === 'function') {
      onFocus(name);
    }
  }, [onFocus, name]);
  const internalOnBlur = React.useCallback(() => {
    setTouched(true);
  }, [setTouched]);
  const fieldProps = fieldToTextField(props);
  delete fieldProps.helperText;
  delete fieldProps.openCreate;
  return (
    <div style={{ position: 'relative' }}>
      <MUIAutocomplete
        size="small"
        selectOnFocus={true}
        autoHighlight={true}
        handleHomeEndKeys={true}
        getOptionLabel={(option) => (typeof option === 'object' ? option.label : option)}
        noOptionsText={noOptionsText}
        {...fieldProps}
        renderOption={renderOption}
        renderInput={({ inputProps: { value, ...inputProps }, ...params }) => (
          <TextField
            {...{ ...params, inputProps }}
            {...textfieldprops}
            value={value ? t(value) : value}
            name={name}
            fullWidth={true}
            error={!isNil(meta.error)}
            helperText={meta.error || textfieldprops.helperText}
          />
        )}
        onChange={internalOnChange}
        onFocus={internalOnFocus}
        onBlur={internalOnBlur}
      />
      {typeof openCreate === 'function' && (
        <IconButton
          onClick={() => openCreate()}
          edge="end"
          style={{ position: 'absolute', top: 5, right: 35 }}
          size="large"
        >
          <Add />
        </IconButton>
      )}
    </div>
  );
};

export default AutocompleteField;
