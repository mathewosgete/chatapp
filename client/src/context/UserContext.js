import React, { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = (props) => {
  const [userdata, setUserdata] = useState({
    user: undefined,
    token: undefined,
  });

  return (
    <UserContext.Provider value={{ userdata, setUserdata }}>
      {props.children}
    </UserContext.Provider>
  );
};

export default UserContext;
