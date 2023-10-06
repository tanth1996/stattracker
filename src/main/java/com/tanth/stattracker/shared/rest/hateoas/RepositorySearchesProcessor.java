package com.tanth.stattracker.shared.rest.hateoas;

import org.springframework.data.rest.webmvc.RepositorySearchesResource;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.server.RepresentationModelProcessor;
import org.springframework.stereotype.Component;

@Component
public class RepositorySearchesProcessor implements RepresentationModelProcessor<RepositorySearchesResource> {

    @Override
    public RepositorySearchesResource process(RepositorySearchesResource model) {
        final var findByIdLink = Link.of(String.format("%s/findById{?id}", model.getRequiredLink("self").getHref())).withRel("findById");
        model.add(findByIdLink);
        return model;
    }


}