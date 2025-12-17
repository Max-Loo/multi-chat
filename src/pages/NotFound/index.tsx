import React from 'react';
import { Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full w-full">
      <Result
        status="404"
        title="404"
        subTitle={t($ => $.common.pageNotFound)}
        extra={
          <Button onClick={() => navigate(-1)} type="primary">
            {t($ => $.common.goBack)}
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;