export function Logo({ width = 160, src = '/brand/naengpa-master-logo.png' }) {
  return (
    <img
      src={src}
      alt="냉파마스터"
      style={{
        width,
        height: 'auto',
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
}
