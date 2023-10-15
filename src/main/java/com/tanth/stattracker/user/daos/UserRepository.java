package com.tanth.stattracker.user.daos;

import com.tanth.stattracker.user.models.UserEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface UserRepository extends CrudRepository<UserEntity, Long> {
    UserEntity findByUsername(String username);

    UserEntity findByPlayer_DisplayName(String displayName);

}
